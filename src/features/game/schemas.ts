import { z } from "zod";
import { GAME_RULES } from "@/config/game";
import { PLAYER_SEARCH } from "@/config/rate-limits";

const sessionId = z.uuid();

export const nextQuestionSchema = z.object({ sessionId });

export const answerSchema = z.object({
  sessionId,
  position: z.int().min(1).max(GAME_RULES.questionsPerRound),
  /** Null when the player ran out of time without choosing anyone. */
  playerId: z.int().positive().nullable(),
});

export const playerSearchSchema = z.object({
  q: z.string().trim().min(PLAYER_SEARCH.minQueryLength).max(PLAYER_SEARCH.maxQueryLength),
});

/** Which round to start that is not the daily. Access is checked on the server. */
export const practiceRoundSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("unlimited") }),
  z.object({ mode: z.literal("archive"), date: z.iso.date() }),
  z.object({ mode: z.literal("pack"), packId: z.uuid() }),
]);
