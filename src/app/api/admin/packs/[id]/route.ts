import {
  adminGate,
  changePack,
  getPack,
  packChangeSchema,
  questionIdSchema,
} from "@/features/admin/server";
import { jsonError, readJsonBody } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

const noPack = () => jsonError(404, "That pack was not found.");

export async function GET(_request: Request, context: Context) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const id = questionIdSchema.safeParse((await context.params).id);
  if (!id.success) return noPack();

  const pack = await getPack(id.data);
  return pack ? Response.json(pack) : noPack();
}

/** Changes a pack's name, description, kind or status. */
export async function PATCH(request: Request, context: Context) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const id = questionIdSchema.safeParse((await context.params).id);
  if (!id.success) return noPack();
  const body = await readJsonBody(request, packChangeSchema);
  if ("reply" in body) return body.reply;

  return (await changePack(id.data, body.data)) ? Response.json({ saved: true }) : noPack();
}
