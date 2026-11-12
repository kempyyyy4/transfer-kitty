import { RATE_LIMITS } from "@/config/rate-limits";
import { boardQuerySchema, getBoard } from "@/features/leaderboard/server";
import { getVisitor } from "@/lib/auth";
import { clientAddress, jsonError, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";

/** Stands in for a visitor who has never played, so the board has no "you" row. */
const NOBODY = { userId: "00000000-0000-0000-0000-000000000000", isGuest: false };

/**
 * A Top Kitties board: ?period=today|week|all and, for a friends league, &league=<id>.
 * Anyone can look, including a first-time visitor with no session.
 */
export async function GET(request: Request) {
  const visitor = (await getVisitor()) ?? NOBODY;
  const limitKey = visitor === NOBODY ? `ip:${clientAddress(request)}` : visitor.userId;
  if (!(await isWithinRateLimit(RATE_LIMITS.leaderboard, limitKey))) return tooManyRequests();

  const params = new URL(request.url).searchParams;
  const query = boardQuerySchema.safeParse({
    period: params.get("period") ?? "today",
    league: params.get("league"),
  });
  if (!query.success) return jsonError(400, "The request was not valid.");

  const board = await getBoard(visitor, query.data.period, query.data.league, new Date());
  return board ? Response.json(board) : jsonError(404, "You are not in that league.");
}
