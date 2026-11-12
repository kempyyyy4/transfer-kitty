import { RATE_LIMITS } from "@/config/rate-limits";
import { leaveLeague, leaveLeagueSchema } from "@/features/leaderboard/server";
import { getUserId } from "@/lib/auth";
import { jsonError, notSignedIn, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Leaves a friends league. A league with nobody left in it is deleted. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.leagueChange, userId))) return tooManyRequests();

  const body = await readJsonBody(request, leaveLeagueSchema);
  if ("reply" in body) return body.reply;

  const left = await leaveLeague(userId, body.data.leagueId);
  return left ? Response.json({ left: true }) : jsonError(404, "You are not in that league.");
}
