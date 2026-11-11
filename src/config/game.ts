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
