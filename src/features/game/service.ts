import "server-only";
import { ANSWER_TIME_LIMIT_MS, GAME_RULES } from "@/config/game";
import { TIERS } from "@/config/tiers";
import { puzzleNumberFor, scheduleDailyPuzzles } from "@/features/questions";
import { percentOfPlayers } from "@/features/scoring";
import {
  findDailySession,
  getDailyPuzzle,
  getSessionSummary,
  serveNextQuestion,
  startDailySession,
  submitAnswer,
} from "@/lib/db";
import { ukDayOf } from "@/lib/time/uk-day";
import type { AnswerFeedback, GameSummary, PlayState, StartedGame, TodayStatus } from "./types";

/** The fee for each tier, in level order, as the database's answer function expects it. */
const FEES_BY_TIER = [...TIERS].sort((a, b) => a.level - b.level).map((tier) => tier.feeGbp);

/**
 * Today's puzzle number. Puzzles are scheduled weeks ahead, so a missing one means the
 * scheduled job has not run for a long time; it is created on the spot.
 */
async function todaysPuzzleNumber(today: string): Promise<number> {
  const puzzle = (await getDailyPuzzle(today)) ?? (await createMissingPuzzle(today));
  return puzzle.puzzleNumber;
}

async function createMissingPuzzle(today: string) {
  await scheduleDailyPuzzles(today);
  return { puzzleDate: today, puzzleNumber: puzzleNumberFor(today) };
}

/** Whether a visitor has played today. `userId` is null for someone with no session yet. */
export async function getTodayStatus(userId: string | null, now: Date): Promise<TodayStatus> {
  const today = ukDayOf(now);
  const puzzleNumber = await todaysPuzzleNumber(today);
  const session = userId ? await findDailySession(userId, today) : null;

  if (!session) return { puzzleNumber, played: "not_started" };
  return { puzzleNumber, played: session.completed ? "completed" : "in_progress" };
}

/** Starts today's game for the user, or picks up the one they already started. */
export async function startDailyGame(userId: string, now: Date): Promise<StartedGame> {
  const today = ukDayOf(now);
  const puzzleNumber = await todaysPuzzleNumber(today);
  const sessionId = await startDailySession(userId, today);

  return { sessionId, puzzleNumber };
}

/**
 * The question the player should see now, or the summary if the game is over.
 * Null if the session is not theirs.
 */
export async function advanceGame(userId: string, sessionId: string): Promise<PlayState | null> {
  const state = await serveNextQuestion(sessionId, userId, ANSWER_TIME_LIMIT_MS);
  if (!state) return null;

  if (state.status === "completed") {
    const summary = await getGameSummary(userId, sessionId);
    return summary ? { status: "completed", summary } : null;
  }
  return {
    status: "question",
    position: state.position,
    total: state.total,
    prompt: state.prompt,
    // The player sees the round time; the extra network grace stays the server's secret.
    msRemaining: Math.max(0, GAME_RULES.answerSeconds * 1000 - state.elapsedMs),
    kittySoFar: state.kitty,
  };
}

/**
 * Judges the player's answer to the open question. `playerId` is null if they ran out
 * of time. Returns "not_open" if that question is not the one waiting for an answer,
 * and null if the session is not theirs.
 */
export async function answerQuestion(
  userId: string,
  sessionId: string,
  position: number,
  playerId: number | null,
): Promise<AnswerFeedback | "not_open" | null> {
  const result = await submitAnswer({
    sessionId,
    userId,
    position,
    entityId: playerId,
    timeLimitMs: ANSWER_TIME_LIMIT_MS,
    feesByTier: FEES_BY_TIER,
  });
  if (!result) return null;
  if (result.status === "not_open") return "not_open";

  return {
    outcome: result.outcome,
    tier: result.tier,
    fee: result.fee,
    percent: percentOfPlayers(result.timesGiven, result.timesPlayed),
  };
}

/** Everything the player has answered so far. Null if the session is not theirs. */
export async function getGameSummary(
  userId: string,
  sessionId: string,
): Promise<GameSummary | null> {
  const summary = await getSessionSummary(sessionId, userId);
  if (!summary) return null;

  return {
    puzzleNumber: summary.puzzleNumber,
    completed: summary.completed,
    totalQuestions: summary.totalQuestions,
    totalFee: summary.answers.reduce((total, answer) => total + answer.fee, 0),
    answers: summary.answers.map((answer) => ({
      position: answer.position,
      prompt: answer.prompt,
      outcome: answer.outcome,
      tier: answer.tier,
      fee: answer.fee,
      answer: answer.answer,
      percent: percentOfPlayers(answer.timesGiven, answer.timesPlayed),
    })),
  };
}
