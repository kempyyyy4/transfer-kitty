import { RATE_LIMITS } from "@/config/rate-limits";
import { buy, buySchema } from "@/features/shop/server";
import { getUserId } from "@/lib/auth";
import { jsonError, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

const MESSAGES = {
  not_signed_in: "Sign in to buy from the shop.",
  unknown_item: "That item is not on sale.",
  free: "That item is free. Pick it on your profile.",
  owned: "You already own that.",
  too_poor: "You do not have enough coins yet.",
} as const;

const STATUS = { not_signed_in: 403, unknown_item: 404, free: 409, owned: 409, too_poor: 409 };

/** Buys one item with coins. The price is the server's, never the browser's. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError(403, MESSAGES.not_signed_in);
  if (!(await isWithinRateLimit(RATE_LIMITS.purchase, userId))) return tooManyRequests();

  const body = await readJsonBody(request, buySchema);
  if ("reply" in body) return body.reply;

  const result = await buy(body.data.slot, body.data.itemId);
  if (result.status === "bought") return Response.json({ balance: result.balance });
  return jsonError(STATUS[result.status], MESSAGES[result.status]);
}
