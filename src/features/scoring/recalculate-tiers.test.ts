import { describe, expect, it } from "vitest";
import { effectiveTier, recalculateTiers, type PlayedAnswer } from "./recalculate-tiers";

const GALACTICAT = 7;
const COPYCAT = 1;

function answers(count: number, timesGiven: (index: number) => number): PlayedAnswer[] {
  return Array.from({ length: count }, (_, index) => ({
    entityId: index + 1,
    timesGiven: timesGiven(index),
    startingPopularity: count - index,
  }));
}

function tierOf(result: { entityId: number; tier: number }[], entityId: number) {
  return result.find((answer) => answer.entityId === entityId)?.tier;
}

describe("recalculateTiers", () => {
  it("gives every answer exactly one tier", () => {
    const result = recalculateTiers(answers(40, (index) => index));

    expect(result).toHaveLength(40);
    expect(new Set(result.map((answer) => answer.entityId)).size).toBe(40);
  });

  it("makes the most given answer the cheapest, whatever its starting rank", () => {
    // Player 40 started as the rarest answer but everyone gave it.
    const result = recalculateTiers(answers(40, (index) => (index === 39 ? 500 : 1)));

    expect(tierOf(result, 40)).toBe(COPYCAT);
  });

  it("makes an answer nobody gave rarer than any answer that was given", () => {
    const result = recalculateTiers(answers(40, (index) => (index === 0 ? 0 : 5)));

    expect(tierOf(result, 1)).toBe(GALACTICAT);
  });

  it("keeps 1 to 3 Galacticats", () => {
    for (const count of [15, 100, 400]) {
      const result = recalculateTiers(answers(count, (index) => index % 7));
      const galacticats = result.filter((answer) => answer.tier === GALACTICAT).length;

      expect(galacticats).toBeGreaterThanOrEqual(1);
      expect(galacticats).toBeLessThanOrEqual(3);
    }
  });

  it("breaks ties between equally given answers by the starting data", () => {
    // Nobody gave any answer, so the starting order must come back unchanged.
    const result = recalculateTiers(answers(20, () => 0));

    expect(tierOf(result, 1)).toBe(COPYCAT);
    expect(tierOf(result, 20)).toBe(GALACTICAT);
  });

  it("gives the same result whatever order the answers arrive in", () => {
    const list = answers(30, (index) => (index * 7) % 5);

    expect(recalculateTiers([...list].reverse())).toEqual(recalculateTiers(list));
  });
});

describe("effectiveTier", () => {
  it("uses the admin's override when there is one", () => {
    expect(effectiveTier({ currentTier: 2, adminOverride: 7 })).toBe(7);
  });

  it("otherwise uses the current tier", () => {
    expect(effectiveTier({ currentTier: 2, adminOverride: null })).toBe(2);
  });
});
