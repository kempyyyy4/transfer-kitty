import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

export type QuestionStatus = "draft" | "active" | "retired";
export type QuestionSource = "generated" | "manual";

const statusSchema = z.enum(["draft", "active", "retired"]);
const sourceSchema = z.enum(["generated", "manual"]);

const listSchema = z.object({
  total: z.number(),
  rows: z.array(
    z
      .object({
        id: z.string(),
        prompt: z.string(),
        source: sourceSchema,
        status: statusSchema,
        answer_count: z.number(),
        times_played: z.number(),
        prominence: z.number(),
        puzzle_date: z.string().nullable(),
      })
      .transform((row) => ({
        id: row.id,
        prompt: row.prompt,
        source: row.source,
        status: row.status,
        answerCount: row.answer_count,
        timesPlayed: row.times_played,
        prominence: row.prominence,
        puzzleDate: row.puzzle_date,
      })),
  ),
});

export type AdminQuestionList = z.infer<typeof listSchema>;

export async function listQuestionsForAdmin(filter: {
  search: string | null;
  status: QuestionStatus | null;
  source: QuestionSource | null;
  limit: number;
  offset: number;
}): Promise<AdminQuestionList> {
  const { data, error } = await getServiceClient().rpc("admin_list_questions", {
    p_search: filter.search,
    p_status: filter.status,
    p_source: filter.source,
    p_limit: filter.limit,
    p_offset: filter.offset,
  });
  if (error) throw new Error(`Listing questions failed: ${error.message}`);
  return listSchema.parse(data);
}

const detailSchema = z
  .object({
    id: z.string(),
    prompt: z.string(),
    source: sourceSchema,
    status: statusSchema,
    data_source: z.string(),
    template_key: z.string().nullable(),
    times_played: z.number(),
    prominence: z.number(),
    tiers_recalculated_at: z.string().nullable(),
    puzzle_date: z.string().nullable(),
    live_today: z.boolean(),
    tags: z.array(z.object({ type: z.string(), value: z.string() })),
    packs: z.array(z.object({ id: z.string(), name: z.string() })),
    answers: z.array(
      z
        .object({
          id: z.number(),
          name: z.string(),
          birth_year: z.number().nullable(),
          starting_tier: z.number(),
          current_tier: z.number(),
          override: z.number().nullable(),
          times_given: z.number(),
        })
        .transform((answer) => ({
          id: answer.id,
          name: answer.name,
          birthYear: answer.birth_year,
          startingTier: answer.starting_tier,
          currentTier: answer.current_tier,
          override: answer.override,
          timesGiven: answer.times_given,
        })),
    ),
  })
  .transform((question) => ({
    id: question.id,
    prompt: question.prompt,
    source: question.source,
    status: question.status,
    dataSource: question.data_source,
    templateKey: question.template_key,
    timesPlayed: question.times_played,
    prominence: question.prominence,
    tiersRecalculatedAt: question.tiers_recalculated_at,
    puzzleDate: question.puzzle_date,
    liveToday: question.live_today,
    tags: question.tags,
    packs: question.packs,
    answers: question.answers,
  }));

export type AdminQuestionDetail = z.infer<typeof detailSchema>;

export async function getQuestionForAdmin(
  questionId: string,
  today: string,
): Promise<AdminQuestionDetail | null> {
  const { data, error } = await getServiceClient().rpc("admin_get_question", {
    p_question_id: questionId,
    p_today: today,
  });
  if (error) throw new Error(`Reading the question failed: ${error.message}`);
  return data === null ? null : detailSchema.parse(data);
}

/** Returns false if there is no such question. */
export async function saveQuestionStatus(
  questionId: string,
  status: QuestionStatus,
): Promise<boolean> {
  const { data, error } = await getServiceClient()
    .from("questions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", questionId)
    .select("id");
  if (error) throw new Error(`Saving the question's status failed: ${error.message}`);
  return data.length > 0;
}

async function callForStatus<Status extends string>(
  name: string,
  args: Record<string, unknown>,
  statuses: readonly [Status, ...Status[]],
): Promise<Status> {
  const { data, error } = await getServiceClient().rpc(name, args);
  if (error) throw new Error(`${name} failed: ${error.message}`);
  return z.enum(statuses).parse(data);
}

export function saveTierOverride(
  questionId: string,
  entityId: number,
  tier: number | null,
  today: string,
) {
  return callForStatus(
    "admin_set_tier_override",
    { p_question_id: questionId, p_entity_id: entityId, p_tier: tier, p_today: today },
    ["saved", "not_found", "live_today"],
  );
}

export function insertAnswer(questionId: string, playerId: number, tier: number, today: string) {
  return callForStatus(
    "admin_add_answer",
    { p_question_id: questionId, p_player_id: playerId, p_tier: tier, p_today: today },
    ["added", "exists", "not_found", "not_player_question", "live_today"],
  );
}

export function deleteAnswer(questionId: string, entityId: number, today: string) {
  return callForStatus(
    "admin_remove_answer",
    { p_question_id: questionId, p_entity_id: entityId, p_today: today },
    ["removed", "not_found", "live_today"],
  );
}

export interface ManualQuestionInsert {
  prompt: string;
  status: QuestionStatus;
  prominence: number;
  answers: { entityId: number; tier: number; popularity: number }[];
}

export async function insertManualQuestion(question: ManualQuestionInsert): Promise<string> {
  const { data, error } = await getServiceClient().rpc("create_manual_question", {
    p_prompt: question.prompt,
    p_status: question.status,
    p_prominence: question.prominence,
    p_answers: question.answers.map((answer) => ({
      entity_id: answer.entityId,
      tier: answer.tier,
      popularity: answer.popularity,
    })),
  });
  if (error) throw new Error(`Adding the question failed: ${error.message}`);
  return z.string().parse(data);
}

/** Each listed player's fame score, for ranking a hand-written question's answers. */
export async function getPlayerFame(ids: readonly number[]): Promise<Map<number, number>> {
  const { data, error } = await getServiceClient()
    .from("players")
    .select("id, fame_score")
    .in("id", [...ids]);
  if (error) throw new Error(`Reading players failed: ${error.message}`);
  const rows = z.array(z.object({ id: z.number(), fame_score: z.number() })).parse(data);
  return new Map(rows.map((row) => [row.id, row.fame_score]));
}

const upcomingSchema = z.array(
  z.object({
    date: z.string(),
    number: z.number(),
    questions: z.array(z.object({ id: z.string(), prompt: z.string(), source: sourceSchema })),
  }),
);

export type UpcomingPuzzle = z.infer<typeof upcomingSchema>[number];

export async function getUpcomingPuzzles(from: string, days: number): Promise<UpcomingPuzzle[]> {
  const { data, error } = await getServiceClient().rpc("admin_upcoming_puzzles", {
    p_from: from,
    p_days: days,
  });
  if (error) throw new Error(`Reading the schedule failed: ${error.message}`);
  return upcomingSchema.parse(data);
}
