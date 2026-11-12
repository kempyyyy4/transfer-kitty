import "server-only";
import { randomInt } from "node:crypto";
import { LEADERBOARD, LEAGUES } from "@/config/leaderboard";
import { parseStoredChoice } from "@/features/avatar";
import {
  addLeagueMember,
  insertLeague,
  isLeagueMember,
  readLeaderboard,
  readMyLeagues,
  removeLeagueMember,
} from "@/lib/db";
import { ukDayOf, weekContaining } from "@/lib/time/uk-day";
import { makeInviteCode, normaliseInviteCode } from "./invite-code";
import type { Board, League, Period } from "./types";

/** A fresh code is drawn if one is already taken; with 887 million codes this is rare. */
const INVITE_CODE_ATTEMPTS = 5;

function dateRange(period: Period, now: Date): { from: string | null; to: string | null } {
  const today = ukDayOf(now);
  if (period === "today") return { from: today, to: today };
  if (period === "week") return weekContaining(today);
  return { from: null, to: null };
}

interface Viewer {
  userId: string;
  isGuest: boolean;
}

/**
 * A board for a period, for everyone or one league. Null if the viewer asked for a league
 * they are not in.
 */
export async function getBoard(
  viewer: Viewer,
  period: Period,
  leagueId: string | null,
  now: Date,
): Promise<Board | null> {
  if (leagueId && !(await isLeagueMember(viewer.userId, leagueId))) return null;

  const rows = await readLeaderboard({
    ...dateRange(period, now),
    leagueId,
    userId: viewer.userId,
    limit: LEADERBOARD.entriesShown,
    includeGuests: LEADERBOARD.includeGuests,
  });
  const signInToAppear = viewer.isGuest && !LEADERBOARD.includeGuests && rows.you !== null;
  const entries = rows.entries.map((entry) => ({
    ...entry,
    avatar: parseStoredChoice(entry.avatar),
  }));
  return { period, leagueId, ...rows, entries, signInToAppear };
}

export function getMyLeagues(userId: string): Promise<League[]> {
  return readMyLeagues(userId);
}

export type CreateLeagueOutcome = { status: "created"; league: League } | { status: "too_many" };

export async function createLeague(userId: string, name: string): Promise<CreateLeagueOutcome> {
  for (let attempt = 0; attempt < INVITE_CODE_ATTEMPTS; attempt++) {
    const result = await insertLeague(
      userId,
      name,
      makeInviteCode((n) => randomInt(n)),
      LEAGUES.maxPerPlayer,
    );
    if (result.status === "too_many_leagues") return { status: "too_many" };
    if (result.status === "created") {
      const league = (await readMyLeagues(userId)).find((mine) => mine.id === result.id);
      if (league) return { status: "created", league };
    }
  }
  throw new Error("Could not find a free invite code.");
}

export type JoinLeagueOutcome =
  | { status: "joined"; leagueId: string }
  | { status: "bad_code" | "not_found" | "too_many" | "full" };

export async function joinLeague(userId: string, typedCode: string): Promise<JoinLeagueOutcome> {
  const code = normaliseInviteCode(typedCode);
  if (!code) return { status: "bad_code" };

  const result = await addLeagueMember(userId, code, LEAGUES.maxPerPlayer, LEAGUES.maxMembers);
  if (result.status === "joined") return { status: "joined", leagueId: result.id };
  if (result.status === "not_found") return { status: "not_found" };
  if (result.status === "too_many_leagues") return { status: "too_many" };
  return { status: "full" };
}

export function leaveLeague(userId: string, leagueId: string): Promise<boolean> {
  return removeLeagueMember(userId, leagueId);
}
