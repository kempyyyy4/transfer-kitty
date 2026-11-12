/** Coins players earn. Tom approved these on 12 November 2026. Daily puzzle only. */
export const COIN_REWARDS = {
  /** For finishing the day's round of 7. */
  dailyComplete: 10,
  /** For each Galacticat answer in the daily round. */
  perGalacticat: 5,
  /** Paid on every multiple of `everyDays` in a streak: day 7, 14, 21 and so on. */
  streak: { everyDays: 7, coins: 50 },
} as const;

/** Coin packs sold for real money (stage 12). Prices in pence. */
export const COIN_PACKS = [
  { id: "coins-500", coins: 500, pricePence: 99 },
  { id: "coins-1200", coins: 1200, pricePence: 199 },
  { id: "coins-3500", coins: 3500, pricePence: 499 },
] as const;

/**
 * The shop shows each coin price in real money at the smallest pack's rate, the highest of
 * the three, so the figure never understates what an item costs. Tom chose this.
 */
export const MONEY_EQUIVALENT_PACK = COIN_PACKS[0];
