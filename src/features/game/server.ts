import "server-only";

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
