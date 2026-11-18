import { RATE_LIMITS } from "@/config/rate-limits";
import { getDayDistribution, nextQuestionSchema } from "@/features/game/server";
import { getUserId } from "@/lib/auth";
import { jsonError, notFound, notSignedIn, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** The spread of the day's kitties, for a player's own finished daily round. */
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.leaderboard, userId))) return tooManyRequests();

  const query = nextQuestionSchema.safeParse({
    sessionId: new URL(request.url).searchParams.get("sessionId"),
  });
  if (!query.success) return jsonError(400, "The request was not valid.");

  const distribution = await getDayDistribution(userId, query.data.sessionId);
  return distribution ? Response.json(distribution) : notFound();
}
