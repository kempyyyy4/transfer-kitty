import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

const outcomeSchema = z.enum(["correct", "wrong", "timeout"]);
export type AnswerOutcome = z.infer<typeof outcomeSchema>;

/** Starts the user's attempt at a day's puzzle, or returns the one they already have. */
export async function startDailySession(userId: string, puzzleDate: string): Promise<string> {
  const { data, error } = await getServiceClient().rpc("start_daily_session", {
    p_user_id: userId,
    p_puzzle_date: puzzleDate,
  });
  if (error) throw new Error(`Starting the game failed: ${error.message}`);

  return z.string().parse(data);
}

const sessionRowSchema = z.object({ id: z.string(), completed_at: z.string().nullable() });

/** The user's attempt at a day's puzzle, if they have started one. */
export async function findDailySession(
  userId: string,
  puzzleDate: string,
): Promise<{ sessionId: string; completed: boolean } | null> {
  const { data, error } = await getServiceClient()
    .from("game_sessions")
    .select("id, completed_at")
    .eq("user_id", userId)
    .eq("mode", "daily")
    .eq("puzzle_date", puzzleDate)
    .maybeSingle();
  if (error) throw new Error(`Reading the game failed: ${error.message}`);
  if (!data) return null;

  const row = sessionRowSchema.parse(data);
  return { sessionId: row.id, completed: row.completed_at !== null };
}

const servedSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("completed") }),
  z.object({
    status: z.literal("question"),
    position: z.number(),
    total: z.number(),
    prompt: z.string(),
    elapsed_ms: z.number(),
    kitty: z.number(),
  }),
]);

export type ServedState =
  | { status: "completed" }
  | {
      status: "question";
      position: number;
      total: number;
      prompt: string;
      elapsedMs: number;
      /** Fees earned on the questions already answered. */
      kitty: number;
    };

/**
 * Moves a session on: times out a question left open too long, hands out the next one
 * with the clock started, or completes the session. Null if the session is not the user's.
 */
export async function serveNextQuestion(
  sessionId: string,
  userId: string,
  timeLimitMs: number,
): Promise<ServedState | null> {
  const { data, error } = await getServiceClient().rpc("serve_next_question", {
    p_session_id: sessionId,
    p_user_id: userId,
    p_time_limit_ms: timeLimitMs,
  });
  if (error) throw new Error(`Getting the next question failed: ${error.message}`);
  if (data === null) return null;

  const state = servedSchema.parse(data);
  if (state.status === "completed") return state;
  return {
    status: "question",
    position: state.position,
    total: state.total,
    prompt: state.prompt,
    elapsedMs: state.elapsed_ms,
    kitty: state.kitty,
  };
}

const answeredSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("not_open") }),
  z.object({
    status: z.literal("answered"),
    outcome: outcomeSchema,
    tier: z.number(),
    fee: z.number(),
    times_given: z.number(),
    times_played: z.number(),
  }),
]);

export type AnswerResult =
  | { status: "not_open" }
  | {
      status: "answered";
      outcome: AnswerOutcome;
      tier: number;
      fee: number;
      timesGiven: number;
      timesPlayed: number;
    };

interface AnswerSubmission {
  sessionId: string;
  userId: string;
  position: number;
  /** Null when the player gave no answer. */
  entityId: number | null;
  timeLimitMs: number;
  /** The fee for each tier level, starting at level 0. */
  feesByTier: readonly number[];
}

/** Judges an answer on the database clock. Null if the session is not the user's. */
export async function submitAnswer(submission: AnswerSubmission): Promise<AnswerResult | null> {
  const { data, error } = await getServiceClient().rpc("submit_answer", {
    p_session_id: submission.sessionId,
    p_user_id: submission.userId,
    p_position: submission.position,
    p_entity_id: submission.entityId,
    p_time_limit_ms: submission.timeLimitMs,
    p_fees: submission.feesByTier,
  });
  if (error) throw new Error(`Submitting the answer failed: ${error.message}`);
  if (data === null) return null;

  const result = answeredSchema.parse(data);
  if (result.status === "not_open") return result;
  return {
    status: "answered",
    outcome: result.outcome,
    tier: result.tier,
    fee: result.fee,
    timesGiven: result.times_given,
    timesPlayed: result.times_played,
  };
}

const answerListsSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("not_completed") }),
  z.object({
    status: z.literal("completed"),
    questions: z.array(
      z.object({
        position: z.number(),
        prompt: z.string(),
        times_played: z.number(),
        your_answer: z.number().nullable(),
        answers: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            tier: z.number(),
            times_given: z.number(),
          }),
        ),
      }),
    ),
  }),
]);

export interface QuestionAnswerList {
  position: number;
  prompt: string;
  timesPlayed: number;
  /** The player the user gave, or null if they gave none. */
  yourAnswerId: number | null;
  answers: { id: number; name: string; tier: number; timesGiven: number }[];
}

/**
 * Every valid answer to each question in a session. "not_completed" while the session is
 * still being played, so answers are never revealed early. Null if the session is not theirs.
 */
export async function getSessionAnswerLists(
  sessionId: string,
  userId: string,
): Promise<QuestionAnswerList[] | "not_completed" | null> {
  const { data, error } = await getServiceClient().rpc("get_session_answer_lists", {
    p_session_id: sessionId,
    p_user_id: userId,
  });
  if (error) throw new Error(`Reading the answer lists failed: ${error.message}`);
  if (data === null) return null;

  const lists = answerListsSchema.parse(data);
  if (lists.status === "not_completed") return "not_completed";

  return lists.questions.map((question) => ({
    position: question.position,
    prompt: question.prompt,
    timesPlayed: question.times_played,
    yourAnswerId: question.your_answer,
    answers: question.answers.map((answer) => ({
      id: answer.id,
      name: answer.name,
      tier: answer.tier,
      timesGiven: answer.times_given,
    })),
  }));
}

const summarySchema = z.object({
  puzzle_date: z.string().nullable(),
  puzzle_number: z.number().nullable(),
  completed: z.boolean(),
  total_questions: z.number(),
  answers: z.array(
    z.object({
      position: z.number(),
      prompt: z.string(),
      outcome: outcomeSchema,
      tier: z.number(),
      fee: z.number(),
      answer: z.string().nullable(),
      times_given: z.number(),
      times_played: z.number(),
    }),
  ),
});

export interface SessionSummary {
  puzzleNumber: number | null;
  completed: boolean;
  totalQuestions: number;
  answers: {
    position: number;
    prompt: string;
    outcome: AnswerOutcome;
    tier: number;
    fee: number;
    /** The name the player gave, or null if they gave none. */
    answer: string | null;
    timesGiven: number;
    timesPlayed: number;
  }[];
}

/**
 * What the user has done so far in a session. Questions not yet answered are left out,
 * so their prompts cannot be read early. Null if the session is not the user's.
 */
export async function getSessionSummary(
  sessionId: string,
  userId: string,
): Promise<SessionSummary | null> {
  const { data, error } = await getServiceClient().rpc("get_session_summary", {
    p_session_id: sessionId,
    p_user_id: userId,
  });
  if (error) throw new Error(`Reading the game summary failed: ${error.message}`);
  if (data === null) return null;

  const summary = summarySchema.parse(data);
  return {
    puzzleNumber: summary.puzzle_number,
    completed: summary.completed,
    totalQuestions: summary.total_questions,
    answers: summary.answers.map((answer) => ({
      position: answer.position,
      prompt: answer.prompt,
      outcome: answer.outcome,
      tier: answer.tier,
      fee: answer.fee,
      answer: answer.answer,
      timesGiven: answer.times_given,
      timesPlayed: answer.times_played,
    })),
  };
}
