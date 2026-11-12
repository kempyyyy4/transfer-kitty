import {
  adminGate,
  getQuestion,
  questionIdSchema,
  questionStatusSchema,
  setQuestionStatus,
} from "@/features/admin/server";
import { jsonError, readJsonBody } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

const noQuestion = () => jsonError(404, "That question was not found.");

/** Everything about one question, including every answer and its tiers. */
export async function GET(_request: Request, context: Context) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const id = questionIdSchema.safeParse((await context.params).id);
  if (!id.success) return noQuestion();

  const question = await getQuestion(id.data);
  return question ? Response.json(question) : noQuestion();
}

/** Makes a question active, a draft, or retired. */
export async function PATCH(request: Request, context: Context) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const id = questionIdSchema.safeParse((await context.params).id);
  if (!id.success) return noQuestion();
  const body = await readJsonBody(request, questionStatusSchema);
  if ("reply" in body) return body.reply;

  const saved = await setQuestionStatus(id.data, body.data.status);
  return saved ? Response.json({ saved: true }) : noQuestion();
}
