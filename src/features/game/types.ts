/** What the game's API sends to the browser. Nothing here may carry an unanswered answer. */

export type AnswerOutcome = "correct" | "wrong" | "timeout";

export interface TodayStatus {
  puzzleNumber: number;
  played: "not_started" | "in_progress" | "completed";
}

export interface StartedGame {
  sessionId: string;
  puzzleNumber: number;
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
  /** The share of players who gave this answer. */
  percent: number;
}

export interface GameSummary {
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
  percent: number;
}

/** One valid answer to a question, shown only after the player's round is finished. */
export interface ValidAnswer {
  id: number;
  name: string;
  tier: number;
  fee: number;
  percent: number;
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
