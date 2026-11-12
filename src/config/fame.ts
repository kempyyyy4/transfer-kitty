/**
 * How a player's fame score is built. Fame decides an answer's starting tier:
 * famous players are the answers most people give, so they earn the smallest fees.
 * Career appearances in top leagues are the main signal; the rest are corrections.
 */
export const FAME_WEIGHTS = {
  bigFiveLeagueAppearance: 1,
  otherTopLeagueAppearance: 0.35,
  championsLeagueAppearance: 1.5,
  europaLeagueAppearance: 0.5,
  majorTournamentAppearance: 2,
  /** Caps cover a whole career, so they lift players whose best years predate the match data. */
  internationalCap: 0.75,
  peakMarketValuePerMillionEur: 1,
  peakMarketValueCapMillionEur: 150,
} as const;

/** Competition IDs as they appear in the Transfermarkt dataset. */
export const BIG_FIVE_LEAGUE_IDS = ["GB1", "ES1", "IT1", "L1", "FR1"] as const;
export const CHAMPIONS_LEAGUE_ID = "CL";
export const EUROPA_LEAGUE_ID = "EL";

/**
 * Within one question, a famous player who barely featured in what is being asked about
 * is a rarer answer than their fame suggests. An answer's popularity is the player's fame
 * scaled between `floor` (barely involved) and 1 (fully involved).
 */
export const INVOLVEMENT_FLOOR = 0.35;

/** What counts as fully involved, for each kind of thing a question can ask about. */
export const FULL_INVOLVEMENT = {
  careerAppearances: 60,
  seasonAppearances: 25,
  cupAppearances: 15,
  matchMinutes: 90,
  goals: 10,
  seasonGoals: 25,
  hatTricks: 3,
  finals: 2,
  transferFeeMillionEur: 50,
  tournamentMatches: 3,
} as const;
