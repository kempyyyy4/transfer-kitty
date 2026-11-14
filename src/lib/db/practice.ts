import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

/** Questions for an Unlimited or pack round. See the pick_practice_questions function. */
export async function pickPracticeQuestions(query: {
  userId: string;
  packId: string | null;
  today: string;
  reserveProminence: number;
  count: number;
}): Promise<string[]> {
  const { data, error } = await getServiceClient().rpc("pick_practice_questions", {
    p_user_id: query.userId,
    p_pack_id: query.packId,
    p_today: query.today,
    p_reserve: query.reserveProminence,
    p_count: query.count,
  });
  if (error) throw new Error(`Choosing questions failed: ${error.message}`);
  return z.array(z.string()).parse(data);
}

/** The question IDs of a day's puzzle, in order. */
export async function getPuzzleQuestionIds(puzzleDate: string): Promise<string[]> {
  const { data, error } = await getServiceClient()
    .from("daily_puzzle_questions")
    .select("question_id")
    .eq("puzzle_date", puzzleDate)
    .order("position");
  if (error) throw new Error(`Reading the puzzle failed: ${error.message}`);
  return z
    .array(z.object({ question_id: z.string() }))
    .parse(data)
    .map((row) => row.question_id);
}

export async function startPracticeSession(round: {
  userId: string;
  mode: "archive" | "unlimited" | "pack";
  puzzleDate: string | null;
  packId: string | null;
  questionIds: readonly string[];
}): Promise<string> {
  const { data, error } = await getServiceClient().rpc("start_practice_session", {
    p_user_id: round.userId,
    p_mode: round.mode,
    p_puzzle_date: round.puzzleDate,
    p_pack_id: round.packId,
    p_question_ids: round.questionIds,
  });
  if (error) throw new Error(`Starting the round failed: ${error.message}`);
  return z.string().parse(data);
}

const archiveSchema = z.array(
  z.object({ date: z.string(), number: z.number(), played: z.boolean() }),
);
export type ArchiveDay = z.infer<typeof archiveSchema>[number];

/** Past daily puzzles, newest first. */
export async function getArchiveDays(userId: string | null, today: string): Promise<ArchiveDay[]> {
  const { data, error } = await getServiceClient().rpc("get_archive", {
    p_user_id: userId,
    p_today: today,
  });
  if (error) throw new Error(`Reading the archive failed: ${error.message}`);
  return archiveSchema.parse(data);
}

const livePackSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    kind: z.enum(["era", "world_cup", "player", "other"]),
    pack_questions: z.array(z.object({ count: z.number() })),
  }),
);

export interface LivePack {
  id: string;
  name: string;
  description: string;
  kind: "era" | "world_cup" | "player" | "other";
  questionCount: number;
}

/** Packs on sale, by name. */
export async function getLivePacks(): Promise<LivePack[]> {
  const { data, error } = await getServiceClient()
    .from("packs")
    .select("id, name, description, kind, pack_questions(count)")
    .eq("status", "live")
    .order("name");
  if (error) throw new Error(`Reading packs failed: ${error.message}`);
  return livePackSchema.parse(data).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    kind: row.kind,
    questionCount: row.pack_questions[0]?.count ?? 0,
  }));
}
