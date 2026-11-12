import { RATE_LIMITS } from "@/config/rate-limits";
import { startDailyGame } from "@/features/game";
import { getOrCreateUserId } from "@/lib/auth";
import { tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Starts today's game, signing the visitor in as a guest if they are new. */
export async function POST() {
  const userId = await getOrCreateUserId();
  if (!(await isWithinRateLimit(RATE_LIMITS.gameStart, userId))) return tooManyRequests();

  return Response.json(await startDailyGame(userId, new Date()));
}
