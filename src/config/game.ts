/** Core game rules. Change them here, never in components or logic. */
export const GAME_RULES = {
  questionsPerRound: 7,
  /** Tom changed this from the brief's 25 seconds to 45 on 14 November 2026. */
  answerSeconds: 45,
  /** Extra time the server allows for the answer to travel over the network. */
  answerGraceMs: 1500,
  /** A question needs at least this many valid answers to be kept. */
  minAnswersPerQuestion: 15,
  /** Above this, almost any guess is right, so the question is dropped as too broad. */
  maxAnswersPerQuestion: 400,
  /** Tiers switch from data-based to crowd-based once a question has this many plays. */
  tierRecalculationThreshold: 200,
  /**
   * A wrong guess no longer ends a question (Tom, 18 November 2026): players keep guessing
   * until they are right or time runs out. This cap only stops a script trying every name.
   */
  maxWrongGuesses: 15,
} as const;

/** The time the server allows for an answer: what the player sees, plus the network grace. */
export const ANSWER_TIME_LIMIT_MS = GAME_RULES.answerSeconds * 1000 + GAME_RULES.answerGraceMs;

/**
 * The server's limit for rounds that count for nothing (Archive, Unlimited, packs), so they
 * can be paused or played untimed. Their timer is the player's own choice.
 */
export const PRACTICE_TIME_LIMIT_MS = 60 * 60 * 1000;

/** How each day's puzzle is put together. */
export const DAILY_PUZZLE = {
  /** The UK day of puzzle #1. Set this to the launch date before going live. */
  firstPuzzleDate: "2026-11-22",
  /** Puzzles are created this far ahead, so a missed scheduled job never leaves a day empty. */
  daysScheduledAhead: 30,
  /**
   * A question's prominence is the starting popularity of its third most popular answer.
   * Daily questions must reach this, so even a casual fan can name someone.
   */
  minProminence: 400,
  /**
   * Unlimited only serves questions at or above this prominence, so every round is
   * answerable by most fans. Unfair questions (lesser-known clubs) have prominence 0.
   */
  unlimitedMinProminence: 150,
  /**
   * Unlimited's difficulty levels (Tom, 18 November 2026), as bands of prominence within
   * Unlimited's pool. Easy also gets past dailies, whose prominence is higher still.
   */
  unlimitedDifficulty: {
    easy: { floor: 300, ceiling: null },
    medium: { floor: 150, ceiling: null },
    hard: { floor: 150, ceiling: 300 },
  },
  /** Which answer prominence is read from, counting from 0 for the most popular. */
  prominenceAnswerRank: 2,
  /** At most this many of a day's questions may come from the same template. Tom chose 1. */
  maxQuestionsPerTemplate: 1,
  /**
   * Templates that read alike ("Name a player who played for <club>...") form a family, and
   * a day has at most this many from one family.
   */
  familyLimits: { club: 3 } as Record<string, number>,
  /** How many random candidates are drawn to choose a day's questions from. */
  candidateSampleSize: 300,
} as const;

/** Which family each template belongs to, for DAILY_PUZZLE.familyLimits. */
export const TEMPLATE_FAMILIES: Readonly<Record<string, string>> = {
  "club-season": "club",
  "club-since-2012": "club",
  "club-decade": "club",
  "club-manager": "club",
  "club-cup": "club",
  "club-scorer": "club",
  "nationality-club": "club",
};

/**
 * Club questions only use clubs most fans know: any club that has played in the Premier
 * League since 2012/13, and elsewhere only the `topOtherClubs` best-known clubs, ranked by
 * the fame of their 25 best-known players. Tom set this on 16 November 2026, so lesser
 * La Liga or Serie A sides never come up. Questions failing it are never served at all.
 */
export const DAILY_CLUBS = {
  topOtherClubs: 25,
  /** Questions about one final's line-ups are only fair for the finals most fans watch. */
  finalCompetitions: ["CL", "EL", "FAC"],
} as const;
