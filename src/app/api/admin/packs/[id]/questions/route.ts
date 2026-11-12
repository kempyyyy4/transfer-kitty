import {
  addQuestionToPack,
  adminGate,
  packQuestionSchema,
  questionIdSchema,
  removeQuestionFromPack,
} from "@/features/admin/server";
import { jsonError, readJsonBody } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

async function readTarget(request: Request, context: Context) {
  const id = questionIdSchema.safeParse((await context.params).id);
  if (!id.success) return { reply: jsonError(404, "That pack was not found.") };
  const body = await readJsonBody(request, packQuestionSchema);
  if ("reply" in body) return body;
  return { packId: id.data, questionId: body.data.questionId };
}

export async function POST(request: Request, context: Context) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;
  const target = await readTarget(request, context);
  if ("reply" in target) return target.reply;

  const added = await addQuestionToPack(target.packId, target.questionId);
  return added ? Response.json({ added: true }) : jsonError(404, "Pack or question not found.");
}

export async function DELETE(request: Request, context: Context) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;
  const target = await readTarget(request, context);
  if ("reply" in target) return target.reply;

  await removeQuestionFromPack(target.packId, target.questionId);
  return Response.json({ removed: true });
}
