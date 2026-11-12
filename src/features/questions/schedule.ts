import "server-only";
import { DAILY_PUZZLE, GAME_RULES } from "@/config/game";
import {
  createDailyPuzzle,
  getScheduledPuzzleDates,
  sampleDailyCandidates,
  type QuestionCandidate,
} from "@/lib/db";
import { addDays, daysBetween } from "@/lib/time/uk-day";
import { pickDailyQuestions, type DailyCandidate } from "./pick-daily";

/** Puzzle #1 is the first puzzle date, #2 the day after, and so on. */
export function puzzleNumberFor(puzzleDate: string): number {
  return daysBetween(DAILY_PUZZLE.firstPuzzleDate, puzzleDate) + 1;
}

/** Templates record the clubs a question is about under these names. */
const CLUB_PARAMS = ["clubId", "firstClubId", "secondClubId"];

function toDailyCandidate(question: QuestionCandidate): DailyCandidate {
  const clubIds = CLUB_PARAMS.map((name) => question.templateParams[name]).filter(
    (value): value is number => typeof value === "number",
  );
  return { id: question.id, templateKey: question.templateKey, clubIds };
}

/**
 * Makes sure every day from `today` to the scheduling horizon has a puzzle.
 * Safe to call as often as you like: days that already have a puzzle are left alone.
 * Returns the days it created a puzzle for.
 */
export async function scheduleDailyPuzzles(today: string): Promise<string[]> {
  const from = today < DAILY_PUZZLE.firstPuzzleDate ? DAILY_PUZZLE.firstPuzzleDate : today;
  const to = addDays(today, DAILY_PUZZLE.daysScheduledAhead);
  const scheduled = await getScheduledPuzzleDates(from, to);
  const created: string[] = [];

  for (let day = from; day <= to; day = addDays(day, 1)) {
    if (scheduled.has(day)) continue;

    // Sampled afresh for each day, so questions used by the previous day are gone.
    const candidates = await sampleDailyCandidates(
      DAILY_PUZZLE.minProminence,
      DAILY_PUZZLE.candidateSampleSize,
    );
    const picked = pickDailyQuestions(candidates.map(toDailyCandidate), {
      count: GAME_RULES.questionsPerRound,
      maxPerTemplate: DAILY_PUZZLE.maxQuestionsPerTemplate,
    });
    if (!picked) {
      throw new Error(`Not enough unused questions left to build the puzzle for ${day}.`);
    }

    const wasCreated = await createDailyPuzzle(
      { puzzleDate: day, puzzleNumber: puzzleNumberFor(day) },
      picked.map((question) => question.id),
    );
    if (wasCreated) created.push(day);
  }
  return created;
}
