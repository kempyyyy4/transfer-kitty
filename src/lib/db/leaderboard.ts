import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

export interface LeaderboardQuery {
  /** First and last day to count, inclusive. Null for no limit. */
  from: string | null;
  to: string | null;
  /** Only this league's members, or null for everyone. */
  leagueId: string | null;
  userId: string;
  limit: number;
  includeGuests: boolean;
}

const boardSchema = z.object({
  players: z.number(),
  entries: z.array(
    z.object({
      rank: z.number(),
      name: z.string(),
      total: z.number(),
      days: z.number(),
      is_you: z.boolean(),
    }),
  ),
  you: z.object({ rank: z.number(), total: z.number(), days: z.number() }).nullable(),
});

export interface LeaderboardRows {
  players: number;
  entries: { rank: number; name: string; total: number; days: number; isYou: boolean }[];
  you: { rank: number; total: number; days: number } | null;
}

/** A ranked board of daily kitties. See the get_leaderboard database function. */
export async function readLeaderboard(query: LeaderboardQuery): Promise<LeaderboardRows> {
  const { data, error } = await getServiceClient().rpc("get_leaderboard", {
    p_from: query.from,
    p_to: query.to,
    p_league_id: query.leagueId,
    p_user_id: query.userId,
    p_limit: query.limit,
    p_include_guests: query.includeGuests,
  });
  if (error) throw new Error(`Reading the leaderboard failed: ${error.message}`);

  const board = boardSchema.parse(data);
  return {
    players: board.players,
    entries: board.entries.map((entry) => ({
      rank: entry.rank,
      name: entry.name,
      total: entry.total,
      days: entry.days,
      isYou: entry.is_you,
    })),
    you: board.you,
  };
}
