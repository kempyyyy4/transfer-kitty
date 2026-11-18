import "server-only";
import { getKittyDistribution } from "@/lib/db";

// Server-only parts of the game feature, for route handlers.
export {
  answerSchema,
  nextQuestionSchema,
  playerSearchSchema,
  practiceRoundSchema,
} from "./schemas";
export {
  advanceGame,
  answerQuestion,
  getAnswerLists,
  getGameSummary,
  getTodayStatus,
  startDailyGame,
} from "./service";
export { startPracticeGame, type PracticeStartOutcome } from "./practice";

/** How many bands the day's curve is drawn from. */
const DISTRIBUTION_BANDS = 24;

/** The spread of the day's kitties around the player's own. Counts only. */
export const getDayDistribution = (userId: string, sessionId: string) =>
  getKittyDistribution(sessionId, userId, DISTRIBUTION_BANDS);
