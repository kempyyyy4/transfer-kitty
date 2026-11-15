import { describe, expect, it } from "vitest";
import { TIERS } from "@/config/tiers";
import { formatFee } from "./format";

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
