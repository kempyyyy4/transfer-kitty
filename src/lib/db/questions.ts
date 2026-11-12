import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";
import { inBatches } from "./batches";

/** Small enough that one request stays quick even when every question has hundreds of answers. */
const QUESTIONS_PER_REQUEST = 20;
/** Supabase returns at most this many rows per request. */
const READ_PAGE_SIZE = 1000;
/** IDs travel in the request address, so a batch has to stay short. */
const RETIRE_BATCH_SIZE = 100;

export interface QuestionImport {
  prompt: string;
  answerType: "player" | "club";
  dataSource: string;
  templateKey: string;
  templateParams: Record<string, string | number>;
  dedupeKey: string;
  /** How well known the question's best answers are. Daily puzzles need a high value. */
  prominence: number;
  tags: { type: string; value: string }[];
  answers: { entityId: number; tier: number; popularity: number }[];
}

/**
 * Adds or updates generated questions with their answers and tags.
 * Re-importing a question updates it in place; see the import_questions database function.
 */
export async function importQuestions(
  questions: readonly QuestionImport[],
  onProgress?: (imported: number) => void,
): Promise<void> {
  let imported = 0;

  for (const batch of inBatches(questions, QUESTIONS_PER_REQUEST)) {
    const { error } = await getServiceClient().rpc("import_questions", {
      payload: batch.map(toPayload),
    });
    if (error) throw new Error(`Importing questions failed: ${error.message}`);

    imported += batch.length;
    onProgress?.(imported);
  }
}

function toPayload(question: QuestionImport) {
  return {
    prompt: question.prompt,
    answer_type: question.answerType,
    data_source: question.dataSource,
    template_key: question.templateKey,
    template_params: question.templateParams,
    dedupe_key: question.dedupeKey,
    prominence: question.prominence,
    tags: question.tags,
    answers: question.answers.map((answer) => ({
      entity_id: answer.entityId,
      tier: answer.tier,
      popularity: answer.popularity,
    })),
  };
}

/** How many questions and answers the database holds, for checking an import. */
export async function countQuestions(): Promise<{ activeQuestions: number; answers: number }> {
  const client = getServiceClient();
  const [questions, answers] = await Promise.all([
    client.from("questions").select("id", { count: "exact", head: true }).eq("status", "active"),
    client.from("question_answers").select("entity_id", { count: "exact", head: true }),
  ]);
  const error = questions.error ?? answers.error;
  if (error) throw new Error(`Counting questions failed: ${error.message}`);

  return { activeQuestions: questions.count ?? 0, answers: answers.count ?? 0 };
}

const keyedQuestionSchema = z.array(z.object({ id: z.string(), dedupe_key: z.string() }));

/**
 * Retires every active generated question whose key is not in `currentKeys`: the ones a
 * new generator run no longer produces. Hand-written questions are never touched.
 * Returns how many were retired.
 */
export async function retireGeneratedQuestionsExcept(
  currentKeys: ReadonlySet<string>,
): Promise<number> {
  const client = getServiceClient();
  const staleIds: string[] = [];

  for (let from = 0; ; from += READ_PAGE_SIZE) {
    const { data, error } = await client
      .from("questions")
      .select("id, dedupe_key")
      .eq("source", "generated")
      .eq("status", "active")
      .order("id")
      .range(from, from + READ_PAGE_SIZE - 1);
    if (error) throw new Error(`Reading questions failed: ${error.message}`);

    const page = keyedQuestionSchema.parse(data);
    for (const row of page) {
      if (!currentKeys.has(row.dedupe_key)) staleIds.push(row.id);
    }
    if (page.length < READ_PAGE_SIZE) break;
  }

  for (const batch of inBatches(staleIds, RETIRE_BATCH_SIZE)) {
    const { error } = await client.from("questions").update({ status: "retired" }).in("id", batch);
    if (error) throw new Error(`Retiring questions failed: ${error.message}`);
  }
  return staleIds.length;
}
