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

/**
 * The home screen's team photo: famous players drawn as kitties, in national-style kits and
 * their best-known celebrations. Tom chose close likenesses (PLAN.md 2.6, 2.7). They are
 * never named anywhere in the game, and must pass the legal check before launch.
 */
export const LINEUP: readonly { look: CatLook; label: string; row: "back" | "front" }[] = [
  {
    label: "Blond-bun striker in red",
    row: "back",
    look: {
      fur: "#f0c27a",
      furShade: "#d6a457",
      muzzle: "#fff3dd",
      eyes: "#4a8cff",
      ears: "pointy",
      markings: "none",
      kit: { primary: "#ba0c2f", secondary: "#00205b", pattern: "plain", shorts: "#f2f4ff" },
      boots: "#f2f4ff",
      hair: { style: "bun", colour: "#f6e3a1", shade: "#d8c27a", band: "#d8c27a" },
      accessories: [],
    },
  },
  {
    label: "Brazil number ten, fist to the sky",
    row: "back",
    look: {
      fur: "#4a3020",
      furShade: "#36231a",
      muzzle: "#8a6a55",
      eyes: "#f5c518",
      ears: "pointy",
      markings: "none",
      kit: { primary: "#f5d10e", secondary: "#009c3b", pattern: "plain", shorts: "#1c3f94" },
      boots: "#141414",
      hair: { style: "crop", colour: "#141414", shade: "#2a1a10" },
      pose: "fistUp",
      accessories: [],
    },
  },
  {
    label: "Argentina playmaker with curls",
    row: "back",
    look: {
      fur: "#5a3b26",
      furShade: "#43291a",
      muzzle: "#c9a98c",
      eyes: "#3fd17a",
      ears: "pointy",
      markings: "none",
      kit: { primary: "#75aadb", secondary: "#f2f4ff", pattern: "stripes", shorts: "#141414" },
      boots: "#141414",
      hair: { style: "afro", colour: "#141414", shade: "#2a1a10" },
      pose: "fistUp",
      accessories: [],
    },
  },
  {
    label: "Brazil striker with a front tuft",
    row: "back",
    look: {
      fur: "#6b4a33",
      furShade: "#523725",
      muzzle: "#c9a98c",
      eyes: "#f5c518",
      ears: "pointy",
      markings: "none",
      kit: { primary: "#f5d10e", secondary: "#009c3b", pattern: "plain", shorts: "#1c3f94" },
      boots: "#e8e8e8",
      hair: { style: "tuft", colour: "#141414", shade: "#2a1a10" },
      pose: "armsOut",
      accessories: [],
    },
  },
  {
    label: "Brazil winger with a mohawk",
    row: "back",
    look: {
      fur: "#c98a4b",
      furShade: "#a46c34",
      muzzle: "#f3e2cc",
      eyes: "#3fd17a",
      ears: "pointy",
      markings: "none",
      kit: { primary: "#f5d10e", secondary: "#009c3b", pattern: "plain", shorts: "#1c3f94" },
      boots: "#ff4fa3",
      hair: { style: "mohawk", colour: "#f6ecb4", shade: "#d9c77a" },
      accessories: [],
    },
  },
  {
    label: "Argentina forward, fingers to the sky",
    row: "front",
    look: {
      fur: "#c98a4b",
      furShade: "#a46c34",
      muzzle: "#f3e2cc",
      eyes: "#4a8cff",
      ears: "pointy",
      markings: "none",
      kit: { primary: "#75aadb", secondary: "#f2f4ff", pattern: "stripes", shorts: "#141414" },
      boots: "#f5c518",
      hair: { style: "crop", colour: "#5a3b22", shade: "#3f2816" },
      pose: "pointUp",
      accessories: [],
    },
  },
  {
    label: "Portugal forward landing his jump",
    row: "front",
    look: {
      fur: "#c98a4b",
      furShade: "#a46c34",
      muzzle: "#f3e2cc",
      eyes: "#5a3b22",
      ears: "pointy",
      markings: "none",
      kit: { primary: "#c8102e", secondary: "#046a38", pattern: "plain", shorts: "#046a38" },
      boots: "#f2f4ff",
      hair: { style: "crop", colour: "#2a1a10", shade: "#141414" },
      pose: "armsOut",
      accessories: [],
    },
  },
  {
    label: "France forward, arms folded",
    row: "front",
    look: {
      fur: "#4a3020",
      furShade: "#36231a",
      muzzle: "#8a6a55",
      eyes: "#f5c518",
      ears: "pointy",
      markings: "none",
      kit: { primary: "#1c2a5c", secondary: "#c8102e", pattern: "plain", shorts: "#f2f4ff" },
      boots: "#f5c518",
      pose: "folded",
      accessories: [],
    },
  },
  {
    label: "England midfielder, arms to the crowd",
    row: "front",
    look: {
      fur: "#5a3b26",
      furShade: "#43291a",
      muzzle: "#c9a98c",
      eyes: "#3fd17a",
      ears: "pointy",
      markings: "none",
      kit: { primary: "#f2f4ff", secondary: "#1c2a5c", pattern: "plain", shorts: "#1c2a5c" },
      boots: "#141414",
      hair: { style: "crop", colour: "#141414", shade: "#2a1a10" },
      pose: "armsUp",
      accessories: [],
    },
  },
];
