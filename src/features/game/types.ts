/** What the game's API sends to the browser. Nothing here may carry an unanswered answer. */

export type AnswerOutcome = "correct" | "wrong" | "timeout";

export interface TodayStatus {
  puzzleNumber: number;
  played: "not_started" | "in_progress" | "completed";
  /** Days in a row played, for the flame on the kick-off button. */
  streak: number;
}

export interface StartedGame {
  sessionId: string;
  /** Null for a round that is not the daily. */
  puzzleNumber: number | null;
  /** The first question, or the summary if the round is already over, saving a request. */
  first: PlayState;
}

export interface OpenQuestion {
  status: "question";
  /** 1 for the first question. */
  position: number;
  total: number;
  prompt: string;
  /** Time left on the server's clock when this was sent. */
  msRemaining: number;
  /** Fees earned on the questions already answered. */
  kittySoFar: number;
}

export interface AnsweredQuestion {
  position: number;
  prompt: string;
  outcome: AnswerOutcome;
  tier: number;
  fee: number;
  /** The name the player gave, or null if they gave none. */
  answer: string | null;
}

export type GameMode = "daily" | "archive" | "unlimited" | "pack";

/** A round that is not the daily. Archive, Unlimited and packs need the matching purchase. */
export type Difficulty = "easy" | "medium" | "hard";

export type PracticeRound =
  | { mode: "unlimited"; difficulty: Difficulty }
  | { mode: "archive"; date: string }
  | { mode: "pack"; packId: string };

export interface GameSummary {
  mode: GameMode;
  /** The pack's name, for a pack round. */
  packName: string | null;
  puzzleNumber: number | null;
  completed: boolean;
  totalQuestions: number;
  totalFee: number;
  /** Coins this round earned. 0 until the daily round is finished. */
  coinsEarned: number;
  answers: AnsweredQuestion[];
}

export type PlayState = OpenQuestion | { status: "completed"; summary: GameSummary };

export interface AnswerFeedback {
  outcome: AnswerOutcome;
  tier: number;
  fee: number;
}

/** The reply to a guess: judged, or wrong with guesses to spare and the question still open. */
export type AnswerReply =
  ({ status: "answered" } & AnswerFeedback) | { status: "retry"; guessesLeft: number };

/** The spread of everyone's kitty on the day, for the curve on the results screen. */
export type { KittyDistribution } from "@/lib/db";

/** One valid answer to a question, shown only after the player's round is finished. */
export interface ValidAnswer {
  id: number;
  name: string;
  tier: number;
  fee: number;
}

export interface QuestionAnswers {
  position: number;
  prompt: string;
  /** The player the user gave, or null if they gave none. */
  yourAnswerId: number | null;
  /** Cheapest tier first, most given first within a tier. */
  answers: ValidAnswer[];
}

export interface PlayerSuggestion {
  id: number;
  name: string;
  birthYear: number | null;
  country: string | null;
}
