import { describe, expect, it } from "vitest";
import { TIERS } from "@/config/tiers";
import { buildCat } from "./cat/build-cat";
import { KIT_MASCOT, TIER_SPRITES } from "./cast";

describe("the cast", () => {
  it("has a character for every tier's sprite key", () => {
    for (const tier of TIERS) expect(TIER_SPRITES[tier.spriteKey]).toBeDefined();
  });

  it("draws every character without error", () => {
    for (const look of [KIT_MASCOT, ...Object.values(TIER_SPRITES)]) {
      expect(() => buildCat(look)).not.toThrow();
    }
  });

  it("gives every tier a different look", () => {
    const drawings = Object.values(TIER_SPRITES).map((look) => JSON.stringify(buildCat(look)));

    expect(new Set(drawings).size).toBe(drawings.length);
  });
});
