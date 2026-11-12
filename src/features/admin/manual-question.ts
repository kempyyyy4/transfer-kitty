import { DAILY_PUZZLE, GAME_RULES } from "@/config/game";
import { assignTiers } from "@/features/scoring";

export interface ManualQuestionDraft {
  prompt: string;
  status: "draft" | "active";
  playerIds: number[];
}

export interface BuiltManualQuestion {
  prompt: string;
  status: "draft" | "active";
  prominence: number;
  answers: { entityId: number; tier: number; popularity: number }[];
}

export type BuildOutcome =
  | { status: "ok"; question: BuiltManualQuestion }
  | { status: "repeated_player" | "unknown_player" | "too_few" | "too_many" };

/**
 * Turns a hand-written question into one the game can use. Starting tiers come from each
 * player's fame, exactly as for generated questions, and the crowd reshapes them later.
 */
export function buildManualQuestion(
  draft: ManualQuestionDraft,
  fameByPlayer: ReadonlyMap<number, number>,
): BuildOutcome {
  const ids = draft.playerIds;
  if (new Set(ids).size !== ids.length) return { status: "repeated_player" };
  if (ids.some((id) => !fameByPlayer.has(id))) return { status: "unknown_player" };
  if (ids.length < GAME_RULES.minAnswersPerQuestion) return { status: "too_few" };
  if (ids.length > GAME_RULES.maxAnswersPerQuestion) return { status: "too_many" };

  const tiered = assignTiers(
    ids.map((id) => ({ entityId: id, popularity: fameByPlayer.get(id) ?? 0 })),
  );
  return {
    status: "ok",
    question: {
      prompt: draft.prompt.trim(),
      status: draft.status,
      prominence: tiered[DAILY_PUZZLE.prominenceAnswerRank]?.popularity ?? 0,
      answers: tiered,
    },
  };
}
