import { RATE_LIMITS } from "@/config/rate-limits";
import { listPacks } from "@/features/modes/server";
import { getUserId } from "@/lib/auth";
import { clientAddress, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Themed packs on sale. */
export async function GET(request: Request) {
  const limitKey = (await getUserId()) ?? `ip:${clientAddress(request)}`;
  if (!(await isWithinRateLimit(RATE_LIMITS.shop, limitKey))) return tooManyRequests();
  return Response.json(await listPacks());
}
