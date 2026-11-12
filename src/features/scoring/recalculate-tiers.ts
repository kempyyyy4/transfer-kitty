import { tierLevelsByRank } from "./assign-tiers";

export interface PlayedAnswer {
  entityId: number;
  /** How many players gave this answer. */
  timesGiven: number;
  /** The popularity the starting tier came from. Breaks ties between equally given answers. */
  startingPopularity: number;
}

export interface RecalculatedTier {
  entityId: number;
  tier: number;
}

/**
 * New tiers from how often each answer was actually given. The most given answers become
 * the cheapest; answers nobody gave are the rarest, ranked among themselves by the data.
 * Uses the same tier shares as the starting tiers, so a question keeps 1 to 3 Galacticats.
 */
export function recalculateTiers(answers: readonly PlayedAnswer[]): RecalculatedTier[] {
  const ranked = [...answers].sort(
    (a, b) =>
      b.timesGiven - a.timesGiven ||
      b.startingPopularity - a.startingPopularity ||
      a.entityId - b.entityId,
  );
  const levels = tierLevelsByRank(ranked.length);

  return ranked.map((answer, rank) => ({ entityId: answer.entityId, tier: levels[rank] ?? 1 }));
}

/** The tier that counts: an admin's override if there is one, otherwise the current tier. */
export function effectiveTier(answer: {
  currentTier: number;
  adminOverride: number | null;
}): number {
  return answer.adminOverride ?? answer.currentTier;
}
