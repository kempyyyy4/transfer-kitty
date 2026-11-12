import { MOST_POPULAR_LEVEL, TIER_SHARES, type TierShare } from "@/config/tiers";

export interface RankableAnswer {
  entityId: number;
  /** Higher means more players are expected to give this answer. */
  popularity: number;
}

export interface TieredAnswer extends RankableAnswer {
  tier: number;
}

/**
 * Tier levels for a question with `answerCount` valid answers, ordered from the
 * most popular answer to the rarest.
 */
export function tierLevelsByRank(answerCount: number): number[] {
  const levels = new Array<number>(answerCount).fill(MOST_POPULAR_LEVEL);
  let nextRarest = answerCount - 1;

  for (const share of TIER_SHARES) {
    const size = Math.min(shareSize(share, answerCount), nextRarest + 1);
    for (let i = 0; i < size; i++) {
      levels[nextRarest] = share.level;
      nextRarest--;
    }
  }
  return levels;
}

function shareSize(share: TierShare, answerCount: number): number {
  const size = Math.round(share.share * answerCount);
  return Math.min(Math.max(size, share.min ?? 0), share.max ?? Infinity);
}

/** Ranks answers by popularity and gives each its tier. */
export function assignTiers(answers: readonly RankableAnswer[]): TieredAnswer[] {
  // Entity ID breaks ties so the same data always produces the same tiers.
  const ranked = [...answers].sort(
    (a, b) => b.popularity - a.popularity || a.entityId - b.entityId,
  );
  const levels = tierLevelsByRank(ranked.length);

  return ranked.map((answer, rank) => ({ ...answer, tier: levels[rank] ?? MOST_POPULAR_LEVEL }));
}
