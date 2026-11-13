import { PLAYER_SEARCH, RATE_LIMITS } from "@/config/rate-limits";
import type { PlayerSuggestion } from "@/features/game";
import { playerSearchSchema } from "@/features/game/server";
import { getUserId } from "@/lib/auth";
import { searchPlayers } from "@/lib/db";
import { jsonError, notSignedIn, tooManyRequests } from "@/lib/http";
import { isWithinRateLimit } from "@/lib/rate-limit";
import { toSearchName } from "@/lib/search-name";

/**
 * Name suggestions for the answer box. It searches every player and takes no question,
 * so what it returns cannot hint at the answer.
 */
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return notSignedIn();
  if (!(await isWithinRateLimit(RATE_LIMITS.playerSearch, userId))) return tooManyRequests();

  const query = playerSearchSchema.safeParse({ q: new URL(request.url).searchParams.get("q") });
  if (!query.success) return jsonError(400, "Type at least two letters.");

  const searchName = toSearchName(query.data.q);
  if (searchName.length < PLAYER_SEARCH.minQueryLength) return Response.json([]);

  const players: PlayerSuggestion[] = await searchPlayers(searchName, PLAYER_SEARCH.maxResults);
  return Response.json(players);
}
