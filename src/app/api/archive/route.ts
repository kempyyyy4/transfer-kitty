import { RATE_LIMITS } from "@/config/rate-limits";
import { listArchive } from "@/features/modes/server";
import { getUserId } from "@/lib/auth";
import { clientAddress, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Past daily puzzles. Anyone can see the list; playing them needs the lifetime unlock. */
export async function GET(request: Request) {
  const userId = await getUserId();
  const limitKey = userId ?? `ip:${clientAddress(request)}`;
  if (!(await isWithinRateLimit(RATE_LIMITS.leaderboard, limitKey))) return tooManyRequests();
  return Response.json(await listArchive(userId, new Date()));
}
