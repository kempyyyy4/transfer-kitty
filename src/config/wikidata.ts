/**
 * How Wikidata's club histories are used alongside Transfermarkt's match data.
 * Agreed with Tom on 11 November 2026 after the accuracy comparison in PLAN.md 2.1:
 * the "inclusive" rule.
 */
export const WIKIDATA_RULES = {
  /**
   * Wikidata is only trusted for spells that began by this year. From 2012/13 onwards
   * Transfermarkt has every match, and Wikidata misses over half of recent transfers.
   */
  lastStartYear: 2012,
  /** A spell recorded with zero games was confirmed only 26% of the time, so it is never used. */
  minRecordedGames: 1,
  /** Inclusive rule: a spell with no game count is used (77% confirmed, against 98.6% with one). */
  acceptSpellsWithoutGameCount: true,
} as const;

/**
 * A player's fame comes mainly from matches in the data, which start in 2012/13.
 * For players whose careers began before then, the number of Wikipedia language
 * editions with an article on them fills in what the match data cannot see.
 */
export const WIKIPEDIA_FAME = {
  /** Players born before this year had part of their career before the match data. */
  appliesToPlayersBornBefore: 1990,
  /**
   * Wikipedia editions are turned into fame by comparing with players whose whole peak
   * is inside the match data, born in these years.
   */
  calibrationBirthYears: { from: 1990, to: 1996 },
} as const;
