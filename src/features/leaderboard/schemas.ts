import { z } from "zod";
import { LEAGUES } from "@/config/leaderboard";

export const boardQuerySchema = z.object({
  period: z.enum(["today", "week", "all"]),
  league: z.uuid().nullable(),
});

export const createLeagueSchema = z.object({
  name: z.string().trim().min(LEAGUES.nameMinLength).max(LEAGUES.nameMaxLength),
});

export const joinLeagueSchema = z.object({ code: z.string().max(20) });

export const leaveLeagueSchema = z.object({ leagueId: z.uuid() });
