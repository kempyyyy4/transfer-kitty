import { describe, expect, it } from "vitest";
import { ACCESSORIES, BOOTS, BREEDS, DEFAULT_AVATAR, EYES, FURS } from "@/config/avatar-items";
import { KITS } from "@/config/kits";
import { checkChoice, DEFAULT_CHOICE, lookFor, parseStoredChoice } from "./avatar-choice";
import { buildCat } from "./cat/build-cat";

const NOTHING_OWNED = new Set<string>();

describe("the avatar catalogue", () => {
  it("uses each ID once within a slot", () => {
    for (const list of [FURS, BREEDS, EYES, BOOTS, ACCESSORIES, KITS]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("starts every player with a free default", () => {
    expect(checkChoice(DEFAULT_AVATAR, NOTHING_OWNED)).toBeNull();
  });

  it("has free options in every slot", () => {
    for (const list of [FURS, BREEDS, EYES, BOOTS, ACCESSORIES, KITS]) {
      expect(list.some((item) => item.priceCoins === 0)).toBe(true);
    }
  });

  it("can draw every item without error", () => {
    for (const fur of FURS)
      expect(() => buildCat(lookFor({ ...DEFAULT_CHOICE, fur: fur.id }))).not.toThrow();
    for (const kit of KITS)
      expect(() => buildCat(lookFor({ ...DEFAULT_CHOICE, kit: kit.id }))).not.toThrow();
    for (const item of ACCESSORIES) {
      expect(() => buildCat(lookFor({ ...DEFAULT_CHOICE, accessories: [item.id] }))).not.toThrow();
    }
  });
});

describe("checkChoice", () => {
  const priced = KITS.find((kit) => kit.priceCoins > 0);

  it("refuses an item nobody has heard of", () => {
    expect(checkChoice({ ...DEFAULT_CHOICE, fur: "tartan" }, NOTHING_OWNED)).toBe("unknown_item");
  });

  it("refuses a priced item the player does not own, and allows it once owned", () => {
    expect(priced).toBeDefined();
    const choice = { ...DEFAULT_CHOICE, kit: priced?.id ?? "" };

    expect(checkChoice(choice, NOTHING_OWNED)).toBe("not_owned");
    expect(checkChoice(choice, new Set([priced?.id ?? ""]))).toBeNull();
  });

  it("refuses the same accessory twice", () => {
    expect(
      checkChoice({ ...DEFAULT_CHOICE, accessories: ["headband", "headband"] }, NOTHING_OWNED),
    ).toBe("repeated_accessory");
  });
});

describe("lookFor", () => {
  it("draws the chosen colours", () => {
    const look = lookFor({ ...DEFAULT_CHOICE, fur: "ginger", boots: "red" });

    expect(look.fur).toBe(FURS.find((fur) => fur.id === "ginger")?.fur);
    expect(look.boots).toBe(BOOTS.find((boot) => boot.id === "red")?.colour);
  });

  it("falls back to the default for an item that no longer exists", () => {
    expect(lookFor({ ...DEFAULT_CHOICE, fur: "retired" }).fur).toBe(lookFor(DEFAULT_CHOICE).fur);
  });
});

describe("parseStoredChoice", () => {
  it("gives the default for a missing or damaged avatar", () => {
    expect(parseStoredChoice(null)).toEqual(DEFAULT_CHOICE);
    expect(parseStoredChoice({ fur: 5 })).toEqual(DEFAULT_CHOICE);
  });
});
