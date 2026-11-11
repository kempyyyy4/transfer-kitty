import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { inBatches } from "./batches";

/** Small enough that one request stays quick even when every question has hundreds of answers. */
const QUESTIONS_PER_REQUEST = 20;

export interface QuestionImport {
  prompt: string;
  answerType: "player" | "club";
  dataSource: string;
  templateKey: string;
  templateParams: Record<string, string | number>;
  dedupeKey: string;
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
    tags: question.tags,
    answers: question.answers.map((answer) => ({
      entity_id: answer.entityId,
      tier: answer.tier,
      popularity: answer.popularity,
    })),
  };
}

/** How many questions and answers the database holds, for checking an import. */
export async function countQuestions(): Promise<{ questions: number; answers: number }> {
  const client = getServiceClient();
  const [questions, answers] = await Promise.all([
    client.from("questions").select("id", { count: "exact", head: true }),
    client.from("question_answers").select("entity_id", { count: "exact", head: true }),
  ]);
  const error = questions.error ?? answers.error;
  if (error) throw new Error(`Counting questions failed: ${error.message}`);

  return { questions: questions.count ?? 0, answers: answers.count ?? 0 };
}
