import { describe, expect, it } from "vitest";
import { COIN_REWARDS } from "@/config/coins";
import { roundRewards } from "./rewards";

const total = (entries: { delta: number }[]) => entries.reduce((sum, e) => sum + e.delta, 0);

describe("roundRewards", () => {
  it("pays for finishing the daily", () => {
    const entries = roundRewards({ sessionId: "s1", galacticats: 0, streak: 1 });
    expect(total(entries)).toBe(COIN_REWARDS.dailyComplete);
  });

  it("pays for each Galacticat", () => {
    const entries = roundRewards({ sessionId: "s1", galacticats: 3, streak: 2 });
    expect(total(entries)).toBe(COIN_REWARDS.dailyComplete + 3 * COIN_REWARDS.perGalacticat);
  });

  it("pays the streak bonus on every 7th day, not between", () => {
    const bonus = (streak: number) =>
      roundRewards({ sessionId: "s", galacticats: 0, streak }).some((e) => e.reason === "streak");
    expect([6, 7, 8, 13, 14, 21].map(bonus)).toEqual([false, true, false, false, true, true]);
  });

  it("gives each reward a key tied to the round, so it can only be paid once", () => {
    const keys = roundRewards({ sessionId: "abc", galacticats: 1, streak: 7 }).map((e) => e.key);
    expect(keys).toEqual(["daily_complete:abc", "galacticats:abc", "streak:abc"]);
  });
});
