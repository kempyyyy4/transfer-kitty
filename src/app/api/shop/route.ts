import { RATE_LIMITS } from "@/config/rate-limits";
import { getShop } from "@/features/shop/server";
import { getUserId } from "@/lib/auth";
import { clientAddress, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Everything on sale, with the visitor's balance and what they own. */
export async function GET(request: Request) {
  const limitKey = (await getUserId()) ?? `ip:${clientAddress(request)}`;
  if (!(await isWithinRateLimit(RATE_LIMITS.shop, limitKey))) return tooManyRequests();

  return Response.json(await getShop());
}
