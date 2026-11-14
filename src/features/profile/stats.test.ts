import { describe, expect, it } from "vitest";
import { computeStats, type PlayedDay } from "./stats";

const TODAY = "2026-11-12";

function played(...dates: string[]): PlayedDay[] {
  return dates.map((date, index) => ({ date, totalFee: (index + 1) * 10_000_000 }));
}

describe("computeStats", () => {
  it("is all zeros before the first game", () => {
    expect(computeStats([], TODAY)).toEqual({
      gamesPlayed: 0,
      currentStreak: 0,
      bestStreak: 0,
      averageKitty: 0,
      bestDay: null,
      lifeUsedThisMonth: false,
    });
  });

  it("counts a streak that includes today", () => {
    expect(
      computeStats(played("2026-11-10", "2026-11-11", "2026-11-12"), TODAY).currentStreak,
    ).toBe(3);
  });

  it("keeps a streak alive when today is not played yet", () => {
    expect(computeStats(played("2026-11-10", "2026-11-11"), TODAY).currentStreak).toBe(2);
  });

  it("breaks the streak after a missed day", () => {
    const stats = computeStats(played("2026-11-08", "2026-11-09", "2026-11-10"), TODAY);

    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(3);
  });

  it("finds the best streak among several, in any order", () => {
    const history = played("2026-11-12", "2026-11-01", "2026-11-03", "2026-11-02", "2026-11-11");

    expect(computeStats(history, TODAY)).toMatchObject({ currentStreak: 2, bestStreak: 3 });
  });

  it("runs across month ends and a clock change", () => {
    const history = played("2026-10-24", "2026-10-25", "2026-10-26", "2026-10-31", "2026-11-01");

    expect(computeStats(history, "2026-11-01")).toMatchObject({ currentStreak: 2, bestStreak: 3 });
  });

  it("averages kitties and finds the best day, the earlier one on a tie", () => {
    const history: PlayedDay[] = [
      { date: "2026-11-10", totalFee: 100_000_000 },
      { date: "2026-11-11", totalFee: 300_000_000 },
      { date: "2026-11-12", totalFee: 300_000_000 },
    ];
    const stats = computeStats(history, TODAY);

    expect(stats.averageKitty).toBe(233_333_333);
    expect(stats.bestDay).toEqual({ date: "2026-11-11", totalFee: 300_000_000 });
  });
});

describe("Nine Lives", () => {
  const lives = { nineLives: true };

  it("bridges one missed day in a month", () => {
    const history = played("2026-11-08", "2026-11-09", "2026-11-11", "2026-11-12");
    expect(computeStats(history, TODAY, lives)).toMatchObject({
      currentStreak: 4,
      lifeUsedThisMonth: true,
    });
    expect(computeStats(history, TODAY).currentStreak).toBe(2);
  });

  it("only bridges one missed day per month", () => {
    const history = played("2026-11-05", "2026-11-07", "2026-11-09", "2026-11-10");
    expect(computeStats(history, "2026-11-10", lives)).toMatchObject({ bestStreak: 2 });
  });

  it("gives a fresh life each calendar month", () => {
    const history = played("2026-10-29", "2026-10-31", "2026-11-01", "2026-11-03");
    expect(computeStats(history, "2026-11-03", lives).currentStreak).toBe(4);
  });

  it("never bridges two missed days in a row", () => {
    const history = played("2026-11-08", "2026-11-11");
    expect(computeStats(history, "2026-11-11", lives).currentStreak).toBe(1);
  });

  it("keeps a streak alive through yesterday when a life is left", () => {
    const history = played("2026-11-09", "2026-11-10");
    expect(computeStats(history, TODAY, lives)).toMatchObject({
      currentStreak: 2,
      lifeUsedThisMonth: true,
    });
    expect(computeStats(history, TODAY).currentStreak).toBe(0);
  });
});
