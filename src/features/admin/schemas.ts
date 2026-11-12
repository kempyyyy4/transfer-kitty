import { z } from "zod";
import { GAME_RULES } from "@/config/game";
import { STRAY_LEVEL, TIERS } from "@/config/tiers";

const TOP_LEVEL = Math.max(...TIERS.map((tier) => tier.level));
/** A tier an answer can have: every level except Stray, which means a wrong answer. */
const tierLevel = z
  .number()
  .int()
  .min(STRAY_LEVEL + 1)
  .max(TOP_LEVEL);
const entityId = z.number().int().positive();

export const unlockSchema = z.object({ password: z.string().min(1).max(200) });

export const questionListSchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["draft", "active", "retired"]).optional(),
  source: z.enum(["generated", "manual"]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export const questionIdSchema = z.uuid();

export const questionStatusSchema = z.object({ status: z.enum(["draft", "active", "retired"]) });

/** A null tier clears the override, so the answer goes back to its data or crowd tier. */
export const tierOverrideSchema = z.object({ entityId, tier: tierLevel.nullable() });

export const addAnswerSchema = z.object({ playerId: entityId, tier: tierLevel });

export const removeAnswerSchema = z.object({ entityId });

export const newQuestionSchema = z.object({
  prompt: z.string().trim().min(10).max(200),
  status: z.enum(["draft", "active"]),
  playerIds: z.array(entityId).min(1).max(GAME_RULES.maxAnswersPerQuestion),
});

export const reportAnswerSchema = z.object({
  sessionId: z.uuid(),
  position: z.number().int().min(1).max(GAME_RULES.questionsPerRound),
  playerId: entityId,
});

export const dismissReportSchema = z.object({ questionId: z.uuid(), playerId: entityId });

const packKind = z.enum(["era", "world_cup", "player", "other"]);
const packName = z.string().trim().min(3).max(40);
const packDescription = z.string().trim().max(200);

export const newPackSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: packName,
  description: packDescription,
  kind: packKind,
});

export const packChangeSchema = z
  .object({
    name: packName.optional(),
    description: packDescription.optional(),
    kind: packKind.optional(),
    status: z.enum(["draft", "live", "retired"]).optional(),
  })
  .refine((change) => Object.keys(change).length > 0);

export const packQuestionSchema = z.object({ questionId: z.uuid() });
