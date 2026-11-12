import { LEAGUES } from "@/config/leaderboard";
import { RATE_LIMITS } from "@/config/rate-limits";
import { joinLeague, joinLeagueSchema } from "@/features/leaderboard/server";
import { getOrCreateUserId } from "@/lib/auth";
import { jsonError, readJsonBody, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

const MESSAGES = {
  bad_code: "That is not an invite code. Codes are 6 letters and numbers.",
  not_found: "No league has that code.",
  too_many: `You can be in at most ${LEAGUES.maxPerPlayer} leagues.`,
  full: "That league is full.",
} as const;

/** Joins a friends league by invite code. A first-time visitor becomes a guest to join. */
export async function POST(request: Request) {
  const userId = await getOrCreateUserId();
  if (!(await isWithinRateLimit(RATE_LIMITS.leagueChange, userId))) return tooManyRequests();

  const body = await readJsonBody(request, joinLeagueSchema);
  if ("reply" in body) return body.reply;

  const outcome = await joinLeague(userId, body.data.code);
  if (outcome.status === "joined") return Response.json({ leagueId: outcome.leagueId });
  return jsonError(outcome.status === "bad_code" ? 400 : 409, MESSAGES[outcome.status]);
}
