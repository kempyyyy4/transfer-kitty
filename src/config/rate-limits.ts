export interface RateLimitRule {
  /** Names the counter. Each user gets their own count under each name. */
  name: string;
  limit: number;
  windowSeconds: number;
}

/**
 * How many requests one user may make. Generous for a real player, tight for a script.
 * A full game is 1 start, about 8 "next" calls and 7 answers.
 */
export const RATE_LIMITS = {
  /** Typing a name fires a search every few letters. */
  playerSearch: { name: "player-search", limit: 120, windowSeconds: 60 },
  gameStart: { name: "game-start", limit: 10, windowSeconds: 60 },
  gamePlay: { name: "game-play", limit: 60, windowSeconds: 60 },
  leaderboard: { name: "leaderboard", limit: 60, windowSeconds: 60 },
  profile: { name: "profile", limit: 60, windowSeconds: 60 },
  /** Each try sends an email, so this stays low. Counted per IP address. */
  signIn: { name: "sign-in", limit: 5, windowSeconds: 600 },
  accountChange: { name: "account-change", limit: 20, windowSeconds: 600 },
  /** Creating, joining and leaving leagues. Low, because a script could spam invite codes. */
  leagueChange: { name: "league-change", limit: 10, windowSeconds: 600 },
  /** Reporting a missing answer after a round. */
  answerReport: { name: "answer-report", limit: 20, windowSeconds: 600 },
  /** Typing the admin password. Counted per IP address, and kept very low. */
  adminUnlock: { name: "admin-unlock", limit: 5, windowSeconds: 900 },
  /** Everything else in the admin area, once in. */
  admin: { name: "admin", limit: 120, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitRule>;

export const PLAYER_SEARCH = {
  minQueryLength: 2,
  maxQueryLength: 40,
  maxResults: 8,
} as const;
