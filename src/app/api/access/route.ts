import { RATE_LIMITS } from "@/config/rate-limits";
import { getMyAccess } from "@/features/payments/server";
import { getUserId } from "@/lib/auth";
import { clientAddress, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** What the visitor has paid for: the lifetime unlock and their packs. */
export async function GET(request: Request) {
  const limitKey = (await getUserId()) ?? `ip:${clientAddress(request)}`;
  if (!(await isWithinRateLimit(RATE_LIMITS.shop, limitKey))) return tooManyRequests();
  return Response.json(await getMyAccess());
}
