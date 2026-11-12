import { describe, expect, it } from "vitest";
import { shareText } from "./share-text";

describe("shareText", () => {
  it("matches the brief's format", () => {
    expect(
      shareText({ puzzleNumber: 47, totalFee: 412_000_000, tierLevels: [1, 3, 7, 0, 4, 6, 7] }),
    ).toBe("🐱 £412m · 2 Galacticats · Transfer Kitty #47\n⬜🟩🦁⬛🟦🟧🦁");
  });

  it("uses the singular for one Galacticat", () => {
    expect(shareText({ puzzleNumber: 1, totalFee: 100_000_000, tierLevels: [7] })).toBe(
      "🐱 £100m · 1 Galacticat · Transfer Kitty #1\n🦁",
    );
  });

  it("leaves the Galacticat count out when there are none", () => {
    expect(shareText({ puzzleNumber: 3, totalFee: 0, tierLevels: [0, 0] })).toBe(
      "🐱 £0 · Transfer Kitty #3\n⬛⬛",
    );
  });
});
