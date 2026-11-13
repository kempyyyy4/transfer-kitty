import { RATE_LIMITS } from "@/config/rate-limits";
import { getPurchaseStatus, purchaseIdSchema } from "@/features/payments/server";
import { getUserId } from "@/lib/auth";
import { jsonError, notSignedIn, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

type Context = { params: Promise<{ id: string }> };

/** Whether one of the visitor's purchases has been paid for yet. */
export async function GET(_request: Request, context: Context) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.shop, userId))) return tooManyRequests();

  const id = purchaseIdSchema.safeParse((await context.params).id);
  if (!id.success) return jsonError(404, "That purchase was not found.");

  const status = await getPurchaseStatus(id.data);
  return status ? Response.json({ status }) : jsonError(404, "That purchase was not found.");
}
