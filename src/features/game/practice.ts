import "server-only";
import { DAILY_PUZZLE, GAME_RULES } from "@/config/game";
import { getAccess } from "@/features/payments/server";
import { getPuzzleQuestionIds, pickPracticeQuestions, startPracticeSession } from "@/lib/db";
import { ukDayOf } from "@/lib/time/uk-day";
import type { PracticeRound, StartedGame } from "./types";

export type PracticeStartOutcome =
  { status: "started"; game: StartedGame } | { status: "locked" | "not_found" | "empty" };

/**
 * Starts an Archive, Unlimited or pack round. None of them count on Top Kitties or earn
 * coins, and none can show a question from today's or a coming daily puzzle.
 */
export async function startPracticeGame(
  userId: string,
  round: PracticeRound,
  now: Date,
): Promise<PracticeStartOutcome> {
  const today = ukDayOf(now);
  const access = await getAccess(userId);

  if (round.mode === "pack" && !access.packIds.includes(round.packId)) return { status: "locked" };
  if (round.mode !== "pack" && !access.lifetime) return { status: "locked" };

  let questionIds: string[];
  if (round.mode === "archive") {
    // Only days already over: today's puzzle is the daily, not an archive.
    if (round.date >= today) return { status: "not_found" };
    questionIds = await getPuzzleQuestionIds(round.date);
    if (questionIds.length === 0) return { status: "not_found" };
  } else {
    questionIds = await pickPracticeQuestions({
      userId,
      packId: round.mode === "pack" ? round.packId : null,
      today,
      reserveProminence: DAILY_PUZZLE.minProminence,
      count: GAME_RULES.questionsPerRound,
    });
    if (questionIds.length === 0) return { status: "empty" };
  }

  const sessionId = await startPracticeSession({
    userId,
    mode: round.mode,
    puzzleDate: round.mode === "archive" ? round.date : null,
    packId: round.mode === "pack" ? round.packId : null,
    questionIds,
  });
  return { status: "started", game: { sessionId, puzzleNumber: null } };
}
