export {
  deleteUser,
  getDisplayName,
  mergeGuestIntoAccount,
  saveDisplayName,
  savePendingMerge,
  takePendingMerge,
  type MergeResult,
} from "./accounts";
export {
  getIdsByTransfermarktId,
  upsertClubs,
  upsertPlayers,
  type ClubImport,
  type PlayerImport,
} from "./entities";
export {
  findDailySession,
  getSessionAnswerLists,
  getSessionSummary,
  serveNextQuestion,
  startDailySession,
  submitAnswer,
  type AnswerOutcome,
  type AnswerResult,
  type QuestionAnswerList,
  type ServedState,
  type SessionSummary,
} from "./game";
export { isDatabaseReachable } from "./health";
export { readLeaderboard, type LeaderboardQuery, type LeaderboardRows } from "./leaderboard";
export {
  addLeagueMember,
  insertLeague,
  isLeagueMember,
  readMyLeagues,
  removeLeagueMember,
  type CreateLeagueResult,
  type JoinLeagueResult,
  type LeagueRow,
} from "./leagues";
export { searchPlayers, type PlayerMatch } from "./players";
export { getPlayerHistory, getStoredAvatar, saveAvatar, type HistoryRow } from "./profile";
export {
  createDailyPuzzle,
  getDailyPuzzle,
  getScheduledPuzzleDates,
  sampleDailyCandidates,
  type DailyPuzzle,
  type QuestionCandidate,
} from "./puzzles";
export {
  countQuestions,
  importQuestions,
  retireGeneratedQuestionsExcept,
  type QuestionImport,
} from "./questions";
export { consumeRateLimit } from "./rate-limits";
export {
  getAnswerPlayCounts,
  getQuestionsDueForRecalculation,
  saveRecalculatedTiers,
} from "./tiers";
