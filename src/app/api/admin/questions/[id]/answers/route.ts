import {
  addAnswer,
  addAnswerSchema,
  adminGate,
  questionIdSchema,
  removeAnswer,
  removeAnswerSchema,
} from "@/features/admin/server";
import { jsonError, readJsonBody } from "@/lib/http";
import { LIVE_TODAY_MESSAGE } from "../../messages";

type Context = { params: Promise<{ id: string }> };

const ADD_MESSAGES = {
  exists: "That player is already an answer.",
  not_found: "That question or player was not found.",
  not_player_question: "Only player questions can have players added.",
  live_today: LIVE_TODAY_MESSAGE,
} as const;

/** Adds a valid answer, and closes any open reports of it. */
export async function POST(request: Request, context: Context) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const id = questionIdSchema.safeParse((await context.params).id);
  if (!id.success) return jsonError(404, ADD_MESSAGES.not_found);
  const body = await readJsonBody(request, addAnswerSchema);
  if ("reply" in body) return body.reply;

  const outcome = await addAnswer(id.data, body.data.playerId, body.data.tier);
  if (outcome === "added") return Response.json({ added: true });
  return jsonError(outcome === "not_found" ? 404 : 409, ADD_MESSAGES[outcome]);
}

/** Removes a wrong answer. Rounds already played keep their fees. */
export async function DELETE(request: Request, context: Context) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const id = questionIdSchema.safeParse((await context.params).id);
  if (!id.success) return jsonError(404, "That answer was not found.");
  const body = await readJsonBody(request, removeAnswerSchema);
  if ("reply" in body) return body.reply;

  const outcome = await removeAnswer(id.data, body.data.entityId);
  if (outcome === "removed") return Response.json({ removed: true });
  if (outcome === "live_today") return jsonError(409, LIVE_TODAY_MESSAGE);
  return jsonError(404, "That answer was not found.");
}
