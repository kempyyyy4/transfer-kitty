import { adminGate, createPack, listPacks, newPackSchema } from "@/features/admin/server";
import { jsonError, readJsonBody } from "@/lib/http";

export async function GET() {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;
  return Response.json(await listPacks());
}

/** Adds a pack as a draft. */
export async function POST(request: Request) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const body = await readJsonBody(request, newPackSchema);
  if ("reply" in body) return body.reply;

  const id = await createPack(body.data);
  return id ? Response.json({ id }) : jsonError(409, "Another pack already uses that web name.");
}
