import { RATE_LIMITS } from "@/config/rate-limits";
import { LEAGUES } from "@/config/leaderboard";
import { createLeague, createLeagueSchema, getMyLeagues } from "@/features/leaderboard/server";
import { getUserId } from "@/lib/auth";
import { jsonError, notSignedIn, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** The leagues the visitor is in. */
export async function GET() {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.leaderboard, userId))) return tooManyRequests();

  return Response.json(await getMyLeagues(userId));
}

/** Creates a friends league with the visitor as its first member. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.leagueChange, userId))) return tooManyRequests();

  const body = await readJsonBody(request, createLeagueSchema);
  if ("reply" in body) return body.reply;

  const outcome = await createLeague(userId, body.data.name);
  if (outcome.status === "too_many") {
    return jsonError(409, `You can be in at most ${LEAGUES.maxPerPlayer} leagues.`);
  }
  return Response.json(outcome.league);
}
