import type { CatLook } from "./cat/look";

/**
 * The game's characters. All original: cat-headed footballers drawn in code, with made-up
 * kits. Tier sprites are keyed by the spriteKey in src/config/tiers.ts.
 */

const LION = {
  fur: "#d9a441",
  furShade: "#b8832b",
  muzzle: "#f3dfb0",
  ears: "folded",
  markings: "none",
} as const;

const LION_MANE = { main: "#8a4b1c", shade: "#6b3612" };

/** Kit, the mascot: a smoky blue cat in teal with a yellow sash. */
export const KIT_MASCOT: CatLook = {
  fur: "#5f7a99",
  furShade: "#485e78",
  muzzle: "#e9eef5",
  eyes: "#3fd17a",
  ears: "pointy",
  markings: "none",
  kit: { primary: "#13a39a", secondary: "#f5c518", pattern: "sash", shorts: "#0d3b4f" },
  boots: "#e23d3d",
  accessories: [],
};

export const TIER_SPRITES: Record<string, CatLook> = {
  /** Scruffy cat walking off with a bin bag. */
  stray: {
    fur: "#8d8d8d",
    furShade: "#6e6e6e",
    muzzle: "#c9c9c9",
    eyes: "#c7d23a",
    ears: "torn",
    markings: "none",
    kit: { primary: "#7a7f87", secondary: "#5d626a", pattern: "plain", shorts: "#4a4f57" },
    boots: "#3b2f2a",
    accessories: ["binBag"],
  },
  /** Cat holding up a mirror. */
  copycat: {
    fur: "#2b2b33",
    furShade: "#1f1f26",
    muzzle: "#f2f2f2",
    eyes: "#f5c518",
    ears: "pointy",
    markings: "tuxedo",
    kit: { primary: "#e9eef5", secondary: "#9aa5b5", pattern: "plain", shorts: "#2b2b33" },
    boots: "#1a1a1a",
    accessories: ["mirror"],
  },
  /** Scrappy cat, muddy kit. */
  "alley-cat": {
    fur: "#c96f3b",
    furShade: "#9e5229",
    muzzle: "#f0d9c4",
    eyes: "#7fd36b",
    ears: "torn",
    markings: "none",
    kit: { primary: "#2f8f3f", secondary: "#e9eef5", pattern: "hoops", shorts: "#1d5c28" },
    boots: "#3b2f2a",
    accessories: ["mud"],
  },
  /** Plain tabby, solid squad player. */
  "squad-moggy": {
    fur: "#9c7a55",
    furShade: "#6f5236",
    muzzle: "#e8d8c0",
    eyes: "#d9b23a",
    ears: "pointy",
    markings: "tabby",
    kit: { primary: "#2b5fb8", secondary: "#ffffff", pattern: "plain", shorts: "#ffffff" },
    boots: "#1a1a1a",
    accessories: [],
  },
  /** Confident first-teamer. */
  tomcat: {
    fur: "#6d7b8f",
    furShade: "#53606f",
    muzzle: "#f2f2f2",
    eyes: "#5fc8ff",
    ears: "pointy",
    markings: "tuxedo",
    kit: { primary: "#d3263a", secondary: "#ffffff", pattern: "stripes", shorts: "#1a1a1a" },
    boots: "#ffffff",
    accessories: ["captainsArmband"],
  },
  /** Sharp haircut, sweatband. */
  "pick-of-the-litter": {
    fur: "#e7d3a8",
    furShade: "#c4a974",
    muzzle: "#fff6e3",
    eyes: "#4a8cff",
    ears: "pointy",
    markings: "none",
    kit: { primary: "#1a1a1a", secondary: "#f5c518", pattern: "halves", shorts: "#1a1a1a" },
    boots: "#f5c518",
    accessories: ["quiff", "headband"],
  },
  /** Lion mane. */
  "big-cat": {
    ...LION,
    eyes: "#e8a21c",
    mane: LION_MANE,
    kit: { primary: "#7a1f3d", secondary: "#8fc8ef", pattern: "stripes", shorts: "#ffffff" },
    boots: "#1a1a1a",
    accessories: [],
  },
  /** Lion in gold boots and sunglasses. */
  galacticat: {
    ...LION,
    eyes: "#e8a21c",
    mane: LION_MANE,
    kit: { primary: "#ffffff", secondary: "#f5c518", pattern: "sash", shorts: "#ffffff" },
    boots: "#f5c518",
    accessories: ["sunglasses"],
  },
};
