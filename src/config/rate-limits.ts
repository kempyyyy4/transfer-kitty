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
} as const satisfies Record<string, RateLimitRule>;

export const PLAYER_SEARCH = {
  minQueryLength: 2,
  maxQueryLength: 40,
  maxResults: 8,
} as const;
