import { RATE_LIMITS } from "@/config/rate-limits";
import { checkoutSchema, startCheckout } from "@/features/payments/server";
import { getUserId } from "@/lib/auth";
import { jsonError, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

const MESSAGES = {
  not_signed_in: "Sign in first, so your purchase is saved to your account.",
  unknown_product: "That is not for sale.",
  already_owned: "You already own that.",
  payments_off: "Payments are not switched on yet.",
} as const;

const STATUS = { not_signed_in: 403, unknown_product: 404, already_owned: 409, payments_off: 503 };

/** Starts a Stripe Checkout and returns the address to send the player to. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError(403, MESSAGES.not_signed_in);
  if (!(await isWithinRateLimit(RATE_LIMITS.purchase, userId))) return tooManyRequests();

  const body = await readJsonBody(request, checkoutSchema);
  if ("reply" in body) return body.reply;

  const outcome = await startCheckout(body.data.product, new URL(request.url).origin);
  if (outcome.status === "ready") return Response.json({ url: outcome.url });
  return jsonError(STATUS[outcome.status], MESSAGES[outcome.status]);
}
