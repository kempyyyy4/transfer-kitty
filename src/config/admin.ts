export const ADMIN = {
  /** How long the admin password is remembered before it is asked for again. */
  sessionSeconds: 8 * 60 * 60,
  questionsPerPage: 25,
  reportsShown: 100,
  upcomingPuzzleDays: 14,
  packsShown: 100,
} as const;
