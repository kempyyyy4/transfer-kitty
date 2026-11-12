import {
  adminGate,
  createQuestion,
  listQuestions,
  newQuestionSchema,
  questionListSchema,
} from "@/features/admin/server";
import { GAME_RULES } from "@/config/game";
import { jsonError, readJsonBody } from "@/lib/http";

/** One page of questions, searched and filtered. */
export async function GET(request: Request) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const filter = questionListSchema.safeParse(params);
  if (!filter.success) return jsonError(400, "That search was not valid.");

  return Response.json(await listQuestions(filter.data));
}

const CREATE_MESSAGES = {
  repeated_player: "A player is listed twice.",
  unknown_player: "One of those players is not in the database.",
  too_few: `A question needs at least ${GAME_RULES.minAnswersPerQuestion} answers.`,
  too_many: `A question can have at most ${GAME_RULES.maxAnswersPerQuestion} answers.`,
} as const;

/** Adds a hand-written question. */
export async function POST(request: Request) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const body = await readJsonBody(request, newQuestionSchema);
  if ("reply" in body) return body.reply;

  const outcome = await createQuestion(body.data);
  if (outcome.status === "created") return Response.json({ id: outcome.id });
  return jsonError(400, CREATE_MESSAGES[outcome.status]);
}
