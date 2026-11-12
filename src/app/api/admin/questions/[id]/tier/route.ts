import {
  adminGate,
  questionIdSchema,
  setTierOverride,
  tierOverrideSchema,
} from "@/features/admin/server";
import { jsonError, readJsonBody } from "@/lib/http";
import { LIVE_TODAY_MESSAGE } from "../../messages";

type Context = { params: Promise<{ id: string }> };

/** Sets or clears the admin's tier for one answer. */
export async function POST(request: Request, context: Context) {
  const gate = await adminGate();
  if ("reply" in gate) return gate.reply;

  const id = questionIdSchema.safeParse((await context.params).id);
  if (!id.success) return jsonError(404, "That question was not found.");
  const body = await readJsonBody(request, tierOverrideSchema);
  if ("reply" in body) return body.reply;

  const outcome = await setTierOverride(id.data, body.data.entityId, body.data.tier);
  if (outcome === "saved") return Response.json({ saved: true });
  if (outcome === "live_today") return jsonError(409, LIVE_TODAY_MESSAGE);
  return jsonError(404, "That answer was not found.");
}
