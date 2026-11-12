/**
 * Plays one full daily game against the database named in .env.local, as a throwaway
 * user, and checks the rules the game depends on. The user is deleted afterwards.
 * npm run smoke:game
 *
 * This talks to a real database, so it is run by hand, not in CI. It adds a handful of
 * plays to the question statistics, so point it at the development database only.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { GAME_RULES } from "@/config/game";
import { TIERS } from "@/config/tiers";
import {
  advanceGame,
  answerQuestion,
  getAnswerLists,
  getTodayStatus,
  startDailyGame,
} from "@/features/game/service";
import type { OpenQuestion } from "@/features/game/types";
import { recalculateDueTiers } from "@/features/scoring/recalculation-job";
import { ukDayOf } from "@/lib/time/uk-day";
import { getServiceClient } from "@/lib/supabase/server";

const admin = getServiceClient();
const now = new Date();
/** No player has this ID, so it is always a wrong answer. */
const NOBODY = 2_000_000_000;

function passed(rule: string): void {
  console.log(`  ok  ${rule}`);
}

async function createThrowawayUser(): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email: `smoke-${randomUUID()}@example.test`,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Could not create a test user: ${error?.message}`);
  return data.user.id;
}

async function openQuestion(userId: string, sessionId: string): Promise<OpenQuestion> {
  const state = await advanceGame(userId, sessionId);
  assert.equal(state?.status, "question", "expected an open question");
  return state as OpenQuestion;
}

/** Reads a valid answer straight from the database, which only the server can do. */
async function validAnswerFor(sessionId: string, position: number): Promise<number> {
  const { data: asked } = await admin
    .from("session_questions")
    .select("question_id")
    .eq("session_id", sessionId)
    .eq("position", position)
    .single();
  const { data: answer } = await admin
    .from("question_answers")
    .select("entity_id")
    .eq("question_id", asked?.question_id)
    .order("starting_popularity", { ascending: false })
    .limit(1)
    .single();
  assert.ok(answer, "the question has no answers");
  return answer.entity_id as number;
}

async function play(userId: string): Promise<void> {
  const before = await getTodayStatus(userId, now);
  assert.equal(before.played, "not_started");
  passed(`today is puzzle #${before.puzzleNumber} and a new user has not played it`);

  const game = await startDailyGame(userId, now);
  const again = await startDailyGame(userId, now);
  assert.equal(again.sessionId, game.sessionId);
  passed("starting twice gives the same game, not a second attempt");

  const { error: secondAttempt } = await admin
    .from("game_sessions")
    .insert({ user_id: userId, mode: "daily", puzzle_date: await sessionDate(game.sessionId) });
  assert.ok(secondAttempt, "the database allowed a second daily session");
  passed("the database itself refuses a second daily session");

  const first = await openQuestion(userId, game.sessionId);
  assert.equal(first.position, 1);
  assert.equal(first.total, GAME_RULES.questionsPerRound);
  assert.ok(first.msRemaining <= GAME_RULES.answerSeconds * 1000 && first.msRemaining > 0);
  passed(`question 1 of ${first.total} is served with the clock running`);

  const same = await openQuestion(userId, game.sessionId);
  assert.equal(same.position, 1);
  assert.ok(same.msRemaining <= first.msRemaining);
  passed("asking again returns the same question with less time, never the next one");

  assert.equal(await advanceGame(randomUUID(), game.sessionId), null);
  assert.equal(await answerQuestion(randomUUID(), game.sessionId, 1, NOBODY), null);
  passed("another user cannot see or answer this game");

  assert.equal(await getAnswerLists(userId, game.sessionId), "not_completed");
  passed("the full answer lists are refused while the round is being played");

  assert.equal(await answerQuestion(userId, game.sessionId, 2, NOBODY), "not_open");
  passed("a question that has not been served cannot be answered");

  const wrong = await answerQuestion(userId, game.sessionId, 1, NOBODY);
  assert.deepEqual(wrong, { outcome: "wrong", tier: 0, fee: 0, percent: 0 });
  passed("a wrong answer is a Stray worth nothing");

  assert.equal(await answerQuestion(userId, game.sessionId, 1, NOBODY), "not_open");
  passed("a question cannot be answered twice");

  const second = await openQuestion(userId, game.sessionId);
  assert.equal(second.position, 2);
  const correct = await answerQuestion(
    userId,
    game.sessionId,
    2,
    await validAnswerFor(game.sessionId, 2),
  );
  assert.ok(correct && correct !== "not_open");
  assert.equal(correct.outcome, "correct");
  assert.equal(correct.fee, TIERS.find((tier) => tier.level === correct.tier)?.feeGbp);
  assert.ok(correct.fee > 0 && correct.percent > 0);
  passed(`a valid answer earns its tier's fee (tier ${correct.tier}, £${correct.fee})`);

  const third = await openQuestion(userId, game.sessionId);
  assert.equal(third.kittySoFar, correct.fee);
  assert.deepEqual(await answerQuestion(userId, game.sessionId, 3, null), {
    outcome: "timeout",
    tier: 0,
    fee: 0,
    percent: 0,
  });
  passed("giving no answer is a timeout");

  await openQuestion(userId, game.sessionId);
  const lateAnswer = await validAnswerFor(game.sessionId, 4);
  await admin
    .from("session_questions")
    .update({ served_at: new Date(Date.now() - 60_000).toISOString() })
    .eq("session_id", game.sessionId)
    .eq("position", 4);
  const late = await answerQuestion(userId, game.sessionId, 4, lateAnswer);
  assert.ok(late && late !== "not_open");
  assert.equal(late.outcome, "timeout");
  passed("a valid answer sent after the time limit is still a timeout");

  await openQuestion(userId, game.sessionId);
  await admin
    .from("session_questions")
    .update({ served_at: new Date(Date.now() - 60_000).toISOString() })
    .eq("session_id", game.sessionId)
    .eq("position", 5);
  const sixth = await openQuestion(userId, game.sessionId);
  assert.equal(sixth.position, 6);
  passed("a question left open past the limit is forfeited and the next one is served");

  let total = correct.fee;
  for (const position of [6, 7]) {
    if (position === 7) await openQuestion(userId, game.sessionId);
    const answer = await answerQuestion(
      userId,
      game.sessionId,
      position,
      await validAnswerFor(game.sessionId, position),
    );
    assert.ok(answer && answer !== "not_open");
    total += answer.fee;
  }

  const finished = await advanceGame(userId, game.sessionId);
  assert.equal(finished?.status, "completed");
  assert.ok(finished.status === "completed");
  assert.equal(finished.summary.completed, true);
  assert.equal(finished.summary.answers.length, GAME_RULES.questionsPerRound);
  assert.equal(finished.summary.totalFee, total);
  passed(
    `the game completes with all ${finished.summary.answers.length} answers and a kitty of £${total}`,
  );

  const lists = await getAnswerLists(userId, game.sessionId);
  assert.ok(Array.isArray(lists), "expected answer lists after the round");
  assert.equal(lists.length, GAME_RULES.questionsPerRound);
  for (const list of lists) {
    assert.ok(list.answers.length >= GAME_RULES.minAnswersPerQuestion);
    assert.ok(list.answers.every((answer) => answer.fee > 0));
  }
  const secondList = lists.find((list) => list.position === 2);
  assert.ok(secondList?.answers.some((answer) => answer.id === secondList.yourAnswerId));
  passed(
    "after the round, every question's full answer list is shown, with the player's own answer",
  );

  assert.equal((await recalculateDueTiers(ukDayOf(now))) >= 0, true);
  passed("the nightly tier recalculation runs");

  assert.equal((await getTodayStatus(userId, now)).played, "completed");
  passed("today now shows as played");
}

async function sessionDate(sessionId: string): Promise<string> {
  const { data } = await admin
    .from("game_sessions")
    .select("puzzle_date")
    .eq("id", sessionId)
    .single();
  return data?.puzzle_date as string;
}

const userId = await createThrowawayUser();
try {
  await play(userId);
  console.log("\nAll game rules hold.");
} finally {
  await admin.auth.admin.deleteUser(userId);
}
