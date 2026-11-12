/**
 * The one place tier names, fees and sprite keys are defined.
 * Game logic and the database refer to a tier by its level number only,
 * so anything here except `level` can be renamed freely.
 */
export interface Tier {
  level: number;
  name: string;
  /** Plural, for the share text: "2 Galacticats". */
  plural: string;
  feeGbp: number;
  spriteKey: string;
  /** One per answer in the spoiler-free share text. Rarer tiers are warmer colours. */
  shareEmoji: string;
  meaning: string;
}

export const TIERS: readonly Tier[] = [
  {
    level: 0,
    name: "Stray",
    plural: "Strays",
    feeGbp: 0,
    spriteKey: "stray",
    shareEmoji: "⬛",
    meaning: "Wrong answer or timed out",
  },
  {
    level: 1,
    name: "Copycat",
    plural: "Copycats",
    feeGbp: 500_000,
    spriteKey: "copycat",
    shareEmoji: "⬜",
    meaning: "The answer everyone gave",
  },
  {
    level: 2,
    name: "Alley Cat",
    plural: "Alley Cats",
    feeGbp: 2_000_000,
    spriteKey: "alley-cat",
    shareEmoji: "🟫",
    meaning: "Very common",
  },
  {
    level: 3,
    name: "Squad Moggy",
    plural: "Squad Moggies",
    feeGbp: 8_000_000,
    spriteKey: "squad-moggy",
    shareEmoji: "🟩",
    meaning: "Common",
  },
  {
    level: 4,
    name: "Tomcat",
    plural: "Tomcats",
    feeGbp: 20_000_000,
    spriteKey: "tomcat",
    shareEmoji: "🟦",
    meaning: "Decent",
  },
  {
    level: 5,
    name: "Pick of the Litter",
    plural: "Picks of the Litter",
    feeGbp: 40_000_000,
    spriteKey: "pick-of-the-litter",
    shareEmoji: "🟪",
    meaning: "Rare",
  },
  {
    level: 6,
    name: "Big Cat",
    plural: "Big Cats",
    feeGbp: 70_000_000,
    spriteKey: "big-cat",
    shareEmoji: "🟧",
    meaning: "Very rare",
  },
  {
    level: 7,
    name: "Galacticat",
    plural: "Galacticats",
    feeGbp: 100_000_000,
    spriteKey: "galacticat",
    shareEmoji: "🦁",
    meaning: "Hardly anyone said it",
  },
];

/** The level given to a wrong answer or a timeout. */
export const STRAY_LEVEL = 0;
/** The level given to the most popular valid answers: whatever is left after the shares below. */
export const MOST_POPULAR_LEVEL = 1;

export interface TierShare {
  level: number;
  /** Fraction of a question's valid answers that get this tier. */
  share: number;
  min?: number;
  max?: number;
}

/**
 * How a question's valid answers are split between tiers, rarest tier first.
 * Answers left over after these shares get MOST_POPULAR_LEVEL.
 */
export const TIER_SHARES: readonly TierShare[] = [
  { level: 7, share: 0.02, min: 1, max: 3 },
  { level: 6, share: 0.05 },
  { level: 5, share: 0.08 },
  { level: 4, share: 0.15 },
  { level: 3, share: 0.2 },
  { level: 2, share: 0.25 },
];
