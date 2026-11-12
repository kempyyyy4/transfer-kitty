/**
 * Checks the admin tools and missing-answer reports against the database named in
 * .env.local. Everything it creates is deleted afterwards.
 * npm run smoke:admin
 *
 * Run by hand against the development database only, not in CI.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { GAME_RULES } from "@/config/game";
import {
  addAnswer,
  addQuestionToPack,
  changePack,
  createPack,
  createQuestion,
  dismissReport,
  getPack,
  getQuestion,
  listReports,
  removeAnswer,
  reportMissingAnswer,
  setTierOverride,
} from "@/features/admin/service";
import { getServiceClient } from "@/lib/supabase/server";
import { ukDayOf } from "@/lib/time/uk-day";

const db = getServiceClient();
const cleanUp: (() => Promise<unknown>)[] = [];

function passed(rule: string): void {
  console.log(`  ok  ${rule}`);
}

async function famousPlayers(count: number): Promise<number[]> {
  const { data, error } = await db
    .from("players")
    .select("id")
    .order("fame_score", { ascending: false })
    .limit(count);
  if (error) throw new Error(error.message);
  return data.map((row: { id: number }) => row.id);
}

async function createAccount(): Promise<string> {
  const { data, error } = await db.auth.admin.createUser({
    email: `smoke-${randomUUID()}@example.test`,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Could not create a test user: ${error?.message}`);
  const userId = data.user.id;
  cleanUp.unshift(() => db.auth.admin.deleteUser(userId));
  return userId;
}

async function playedSession(userId: string, questionId: string, finished: boolean) {
  const { data, error } = await db
    .from("game_sessions")
    .insert({
      user_id: userId,
      mode: "unlimited",
      completed_at: finished ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const { error: questionError } = await db
    .from("session_questions")
    .insert({ session_id: data.id, position: 1, question_id: questionId });
  if (questionError) throw new Error(questionError.message);
  return data.id as string;
}

async function checkQuestions(players: number[]): Promise<string> {
  const needed = GAME_RULES.minAnswersPerQuestion;
  const short = await createQuestion({
    prompt: "Smoke test: too short a list",
    status: "draft",
    playerIds: players.slice(0, needed - 1),
  });
  assert.equal(short.status, "too_few");
  passed("a hand-written question needs enough answers");

  const made = await createQuestion({
    prompt: "Smoke test: hand-written question",
    status: "draft",
    playerIds: players.slice(0, needed),
  });
  assert.equal(made.status, "created");
  const id = made.status === "created" ? made.id : "";
  cleanUp.push(() => db.from("questions").delete().eq("id", id));

  const question = await getQuestion(id);
  assert.equal(question?.source, "manual");
  assert.equal(question?.answers.length, needed);
  const tierOf = (playerId: number | undefined) =>
    question?.answers.find((answer) => answer.id === playerId)?.startingTier ?? 0;
  assert.ok(tierOf(players[0]) <= tierOf(players[needed - 1]));
  passed("a hand-written question is saved with tiers from fame, best known cheapest");

  const first = players[0] ?? 0;
  assert.equal(await setTierOverride(id, first, 7), "saved");
  assert.equal((await getQuestion(id))?.answers.find((a) => a.id === first)?.override, 7);
  assert.equal(await setTierOverride(id, first, null), "saved");
  assert.equal((await getQuestion(id))?.answers.find((a) => a.id === first)?.override, null);
  passed("the admin can override any tier, and clear the override");

  const extra = players[needed] ?? 0;
  assert.equal(await addAnswer(id, extra, 3), "added");
  assert.equal(await addAnswer(id, extra, 3), "exists");
  assert.equal(await removeAnswer(id, extra), "removed");
  assert.equal((await getQuestion(id))?.answers.length, needed);
  passed("answers can be added and removed");
  return id;
}

async function checkLiveToday(): Promise<void> {
  const { data } = await db
    .from("daily_puzzle_questions")
    .select("question_id")
    .eq("puzzle_date", ukDayOf(new Date()))
    .limit(1);
  const live = (data as { question_id: string }[] | null)?.[0]?.question_id;
  if (!live) {
    console.log("  --  no puzzle today, so the frozen-today rule was not checked");
    return;
  }
  const answer = (await getQuestion(live))?.answers[0]?.id ?? 0;
  assert.equal(await setTierOverride(live, answer, 7), "live_today");
  assert.equal(await removeAnswer(live, answer), "live_today");
  passed("today's questions are frozen: no tier or answer changes");
}

async function checkReports(questionId: string, players: number[]): Promise<void> {
  const userId = await createAccount();
  const unfinished = await playedSession(userId, questionId, false);
  const finished = await playedSession(userId, questionId, true);
  const missing = players[GAME_RULES.minAnswersPerQuestion + 1] ?? 0;
  const other = players[GAME_RULES.minAnswersPerQuestion + 2] ?? 0;

  assert.equal(await reportMissingAnswer(userId, unfinished, 1, missing), "not_found");
  assert.equal(await reportMissingAnswer(userId, finished, 2, missing), "not_found");
  passed("a report needs a finished round that had the question");

  assert.equal(await reportMissingAnswer(userId, finished, 1, players[0] ?? 0), "already_valid");
  assert.equal(await reportMissingAnswer(userId, finished, 1, missing), "saved");
  assert.equal(await reportMissingAnswer(userId, finished, 1, missing), "already_reported");
  passed("a player can report a missing answer once");

  const isOpen = async (playerId: number) =>
    (await listReports()).some((r) => r.questionId === questionId && r.playerId === playerId);
  assert.ok(await isOpen(missing));
  assert.equal(await addAnswer(questionId, missing, 4), "added");
  assert.ok(!(await isOpen(missing)));
  passed("adding a reported player closes the report");

  assert.equal(await reportMissingAnswer(userId, finished, 1, other), "saved");
  assert.equal(await dismissReport(questionId, other), 1);
  assert.ok(!(await isOpen(other)));
  passed("a report can be dismissed");
}

async function checkPacks(questionId: string): Promise<void> {
  const slug = `smoke-${randomUUID().slice(0, 8)}`;
  const fields = { slug, name: "Smoke Test Pack", description: "", kind: "era" as const };
  const packId = await createPack(fields);
  assert.ok(packId);
  cleanUp.unshift(() => db.from("packs").delete().eq("id", packId));
  assert.equal(await createPack(fields), null);
  passed("a pack's web name is unique");

  assert.ok(await addQuestionToPack(packId, questionId));
  assert.ok(await addQuestionToPack(packId, questionId));
  assert.equal((await getPack(packId))?.questions.length, 1);
  assert.equal((await getQuestion(questionId))?.packs[0]?.id, packId);
  assert.ok(await changePack(packId, { status: "live" }));
  assert.equal((await getPack(packId))?.status, "live");
  passed("questions can be put in a pack, once, and a pack can go live");
}

async function main(): Promise<void> {
  console.log("Admin smoke test");
  const players = await famousPlayers(GAME_RULES.minAnswersPerQuestion + 3);
  try {
    const questionId = await checkQuestions(players);
    await checkLiveToday();
    await checkReports(questionId, players);
    await checkPacks(questionId);
    console.log("All admin checks passed.");
  } finally {
    for (const step of cleanUp) await step();
  }
}

await main();
