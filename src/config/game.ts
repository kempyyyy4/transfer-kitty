/** Core game rules. Change them here, never in components or logic. */
export const GAME_RULES = {
  questionsPerRound: 7,
  answerSeconds: 25,
  /** Extra time the server allows for the answer to travel over the network. */
  answerGraceMs: 1500,
  /** A question needs at least this many valid answers to be kept. */
  minAnswersPerQuestion: 15,
  /** Above this, almost any guess is right, so the question is dropped as too broad. */
  maxAnswersPerQuestion: 400,
  /** Tiers switch from data-based to crowd-based once a question has this many plays. */
  tierRecalculationThreshold: 200,
} as const;

/** The time the server allows for an answer: what the player sees, plus the network grace. */
export const ANSWER_TIME_LIMIT_MS = GAME_RULES.answerSeconds * 1000 + GAME_RULES.answerGraceMs;

/** How each day's puzzle is put together. */
export const DAILY_PUZZLE = {
  /** The UK day of puzzle #1. Set this to the launch date before going live. */
  firstPuzzleDate: "2026-11-12",
  /** Puzzles are created this far ahead, so a missed scheduled job never leaves a day empty. */
  daysScheduledAhead: 30,
  /**
   * A question's prominence is the starting popularity of its third most popular answer.
   * Daily questions must reach this, so even a casual fan can name someone.
   */
  minProminence: 400,
  /** Which answer prominence is read from, counting from 0 for the most popular. */
  prominenceAnswerRank: 2,
  /** At most this many of a day's questions may come from the same template. */
  maxQuestionsPerTemplate: 2,
  /** How many random candidates are drawn to choose a day's questions from. */
  candidateSampleSize: 300,
} as const;
