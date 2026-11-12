import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

const resultSchema = z.object({ status: z.string(), id: z.string().optional() });

export type CreateLeagueResult =
  { status: "created"; id: string } | { status: "too_many_leagues" | "code_taken" };

export type JoinLeagueResult =
  { status: "joined"; id: string } | { status: "not_found" | "too_many_leagues" | "league_full" };

export async function insertLeague(
  ownerId: string,
  name: string,
  inviteCode: string,
  maxLeagues: number,
): Promise<CreateLeagueResult> {
  const { data, error } = await getServiceClient().rpc("create_league", {
    p_owner_id: ownerId,
    p_name: name,
    p_invite_code: inviteCode,
    p_max_leagues: maxLeagues,
  });
  if (error) throw new Error(`Creating the league failed: ${error.message}`);

  const result = resultSchema.parse(data);
  if (result.status === "created" && result.id) return { status: "created", id: result.id };
  if (result.status === "too_many_leagues" || result.status === "code_taken") {
    return { status: result.status };
  }
  throw new Error(`Unexpected league result: ${result.status}`);
}

export async function addLeagueMember(
  userId: string,
  inviteCode: string,
  maxLeagues: number,
  maxMembers: number,
): Promise<JoinLeagueResult> {
  const { data, error } = await getServiceClient().rpc("join_league", {
    p_user_id: userId,
    p_invite_code: inviteCode,
    p_max_leagues: maxLeagues,
    p_max_members: maxMembers,
  });
  if (error) throw new Error(`Joining the league failed: ${error.message}`);

  const result = resultSchema.parse(data);
  if (result.status === "joined" && result.id) return { status: "joined", id: result.id };
  if (
    result.status === "not_found" ||
    result.status === "too_many_leagues" ||
    result.status === "league_full"
  ) {
    return { status: result.status };
  }
  throw new Error(`Unexpected league result: ${result.status}`);
}

/** Returns false if the user was not in that league. */
export async function removeLeagueMember(userId: string, leagueId: string): Promise<boolean> {
  const { data, error } = await getServiceClient().rpc("leave_league", {
    p_user_id: userId,
    p_league_id: leagueId,
  });
  if (error) throw new Error(`Leaving the league failed: ${error.message}`);

  return z.boolean().parse(data);
}

const leaguesSchema = z.array(
  z.object({ id: z.string(), name: z.string(), invite_code: z.string(), members: z.number() }),
);

export interface LeagueRow {
  id: string;
  name: string;
  inviteCode: string;
  members: number;
}

export async function readMyLeagues(userId: string): Promise<LeagueRow[]> {
  const { data, error } = await getServiceClient().rpc("get_my_leagues", {
    p_user_id: userId,
  });
  if (error) throw new Error(`Reading leagues failed: ${error.message}`);

  return leaguesSchema.parse(data).map((row) => ({
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    members: row.members,
  }));
}

export async function isLeagueMember(userId: string, leagueId: string): Promise<boolean> {
  const { count, error } = await getServiceClient()
    .from("league_members")
    .select("user_id", { count: "exact", head: true })
    .eq("league_id", leagueId)
    .eq("user_id", userId);
  if (error) throw new Error(`Checking league membership failed: ${error.message}`);

  return (count ?? 0) > 0;
}
