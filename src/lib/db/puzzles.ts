import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

export interface DailyPuzzle {
  puzzleDate: string;
  puzzleNumber: number;
}

const puzzleRowSchema = z.object({ puzzle_date: z.string(), puzzle_number: z.number() });

/** The puzzle for one UK day, or null if none has been scheduled. */
export async function getDailyPuzzle(puzzleDate: string): Promise<DailyPuzzle | null> {
  const { data, error } = await getServiceClient()
    .from("daily_puzzles")
    .select("puzzle_date, puzzle_number")
    .eq("puzzle_date", puzzleDate)
    .maybeSingle();
  if (error) throw new Error(`Reading the daily puzzle failed: ${error.message}`);
  if (!data) return null;

  const row = puzzleRowSchema.parse(data);
  return { puzzleDate: row.puzzle_date, puzzleNumber: row.puzzle_number };
}

/** The days in a range (inclusive) that already have a puzzle. */
export async function getScheduledPuzzleDates(from: string, to: string): Promise<Set<string>> {
  const { data, error } = await getServiceClient()
    .from("daily_puzzles")
    .select("puzzle_date, puzzle_number")
    .gte("puzzle_date", from)
    .lte("puzzle_date", to);
  if (error) throw new Error(`Reading scheduled puzzles failed: ${error.message}`);

  return new Set(
    z
      .array(puzzleRowSchema)
      .parse(data)
      .map((row) => row.puzzle_date),
  );
}

export interface QuestionCandidate {
  id: string;
  templateKey: string;
  templateParams: Record<string, unknown>;
}

const candidateSchema = z.array(
  z.object({
    id: z.string(),
    template_key: z.string(),
    template_params: z.record(z.string(), z.unknown()),
  }),
);

/** A random handful of well-known questions that no daily puzzle has used yet. */
export async function sampleDailyCandidates(
  minProminence: number,
  sampleSize: number,
): Promise<QuestionCandidate[]> {
  const { data, error } = await getServiceClient().rpc("sample_daily_candidates", {
    p_min_prominence: minProminence,
    p_sample_size: sampleSize,
  });
  if (error) throw new Error(`Reading question candidates failed: ${error.message}`);

  return candidateSchema.parse(data).map((row) => ({
    id: row.id,
    templateKey: row.template_key,
    templateParams: row.template_params,
  }));
}

/** Creates a day's puzzle. Returns false, changing nothing, if the day already has one. */
export async function createDailyPuzzle(
  puzzle: DailyPuzzle,
  questionIds: readonly string[],
): Promise<boolean> {
  const { data, error } = await getServiceClient().rpc("create_daily_puzzle", {
    p_puzzle_date: puzzle.puzzleDate,
    p_puzzle_number: puzzle.puzzleNumber,
    p_question_ids: questionIds,
  });
  if (error) throw new Error(`Creating the daily puzzle failed: ${error.message}`);

  return z.boolean().parse(data);
}
