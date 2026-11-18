import { describe, expect, it } from "vitest";
import { assignTiers, tierLevelsByRank } from "./assign-tiers";

const GALACTICAT = 7;
const COPYCAT = 1;

function countOf(levels: number[], level: number): number {
  return levels.filter((value) => value === level).length;
}

describe("tierLevelsByRank", () => {
  it("gives one tier per answer", () => {
    for (const answerCount of [15, 40, 100, 399]) {
      expect(tierLevelsByRank(answerCount)).toHaveLength(answerCount);
    }
  });

  it("always has exactly one Galacticat answer", () => {
    for (const answerCount of [2, 15, 100, 400, 5000]) {
      expect(countOf(tierLevelsByRank(answerCount), GALACTICAT)).toBe(1);
    }
  });

  it("always keeps at least one cheap Copycat answer", () => {
    for (const answerCount of [2, 3, 15, 16, 17, 100]) {
      expect(countOf(tierLevelsByRank(answerCount), COPYCAT)).toBeGreaterThanOrEqual(1);
    }
  });

  it("never gets rarer as answers get more popular", () => {
    const levels = tierLevelsByRank(100);

    for (let rank = 1; rank < levels.length; rank++) {
      expect(levels[rank]).toBeGreaterThanOrEqual(levels[rank - 1] ?? 0);
    }
  });

  it("splits 100 answers by the configured shares", () => {
    const levels = tierLevelsByRank(100);

    expect([7, 6, 5, 4, 3, 2, 1].map((level) => countOf(levels, level))).toEqual([
      1, 25, 25, 20, 15, 10, 4,
    ]);
  });

  it("puts about half of the answers at £40m or more", () => {
    const levels = tierLevelsByRank(60);
    const expensive = levels.filter((level) => level >= 5).length;

    expect(expensive / levels.length).toBeGreaterThanOrEqual(0.45);
  });

  it("never gives a valid answer the Stray tier", () => {
    expect(countOf(tierLevelsByRank(200), 0)).toBe(0);
  });

  it("copes with a question that has very few answers", () => {
    expect(tierLevelsByRank(0)).toEqual([]);
    expect(tierLevelsByRank(1)).toEqual([GALACTICAT]);
  });
});

describe("assignTiers", () => {
  const answers = Array.from({ length: 20 }, (_, index) => ({
    entityId: index + 1,
    popularity: (index + 1) * 10,
  }));

  it("gives the most popular answer the lowest fee tier", () => {
    const tiered = assignTiers(answers);

    expect(tiered[0]).toMatchObject({ entityId: 20, tier: COPYCAT });
  });

  it("gives the least popular answer the Galacticat tier", () => {
    const tiered = assignTiers(answers);

    expect(tiered.at(-1)).toMatchObject({ entityId: 1, tier: GALACTICAT });
  });

  it("breaks popularity ties the same way every time", () => {
    const tied = [
      { entityId: 3, popularity: 5 },
      { entityId: 1, popularity: 5 },
      { entityId: 2, popularity: 5 },
    ];

    expect(assignTiers(tied).map((answer) => answer.entityId)).toEqual([1, 2, 3]);
    expect(assignTiers([...tied].reverse()).map((answer) => answer.entityId)).toEqual([1, 2, 3]);
  });

  it("does not change the list it was given", () => {
    const original = [...answers];
    assignTiers(answers);

    expect(answers).toEqual(original);
  });
});
