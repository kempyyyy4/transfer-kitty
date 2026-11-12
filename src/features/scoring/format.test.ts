import { describe, expect, it } from "vitest";
import { TIERS } from "@/config/tiers";
import { formatFee, percentOfPlayers } from "./format";

describe("formatFee", () => {
  it("writes every tier fee the way the brief does", () => {
    expect(TIERS.map((tier) => formatFee(tier.feeGbp))).toEqual([
      "£0",
      "£500k",
      "£2m",
      "£8m",
      "£20m",
      "£40m",
      "£70m",
      "£100m",
    ]);
  });

  it("writes kitty totals, keeping a half million", () => {
    expect(formatFee(412_000_000)).toBe("£412m");
    expect(formatFee(412_500_000)).toBe("£412.5m");
    expect(formatFee(700_000_000)).toBe("£700m");
  });
});

describe("percentOfPlayers", () => {
  it("rounds to a whole percentage", () => {
    expect(percentOfPlayers(1, 3)).toBe(33);
    expect(percentOfPlayers(2, 3)).toBe(67);
    expect(percentOfPlayers(5, 5)).toBe(100);
  });

  it("is zero before anyone has played", () => {
    expect(percentOfPlayers(0, 0)).toBe(0);
  });
});
