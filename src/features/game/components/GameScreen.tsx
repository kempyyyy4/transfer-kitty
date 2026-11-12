"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_RULES } from "@/config/game";
import { formatFee } from "@/features/scoring";
import { gameApi, GameApiError } from "../api-client";
import type { AnswerFeedback, GameSummary, OpenQuestion, PlayerSuggestion } from "../types";
import { AnswerInput } from "./AnswerInput";
import { SummaryPanel } from "./SummaryPanel";
import { outcomeLine, tierName } from "./tier-label";
import { TimerBar } from "./TimerBar";

type View =
  | { kind: "loading" }
  | { kind: "question"; question: OpenQuestion }
  | { kind: "feedback"; question: OpenQuestion; answer: string | null; feedback: AnswerFeedback }
  | { kind: "completed"; summary: GameSummary }
  | { kind: "error"; message: string };

function errorView(error: unknown): View {
  const message =
    error instanceof GameApiError ? error.message : "Something went wrong. Try again.";
  return { kind: "error", message };
}

/** Plays today's game: one question at a time, each judged by the server. */
export function GameScreen() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const sessionId = useRef<string | null>(null);
  // Stops the timer running out and a click landing together from sending two answers.
  const answering = useRef(false);

  const showNext = useCallback(async () => {
    if (!sessionId.current) return;
    try {
      const state = await gameApi.next(sessionId.current);
      answering.current = false;
      setView(
        state.status === "completed"
          ? { kind: "completed", summary: state.summary }
          : { kind: "question", question: state },
      );
    } catch (error) {
      setView(errorView(error));
    }
  }, []);

  useEffect(() => {
    gameApi
      .start()
      .then((game) => {
        sessionId.current = game.sessionId;
        return showNext();
      })
      .catch((error: unknown) => setView(errorView(error)));
  }, [showNext]);

  async function submit(question: OpenQuestion, player: PlayerSuggestion | null) {
    if (!sessionId.current || answering.current) return;
    answering.current = true;
    try {
      const feedback = await gameApi.answer(
        sessionId.current,
        question.position,
        player?.id ?? null,
      );
      setView({ kind: "feedback", question, answer: player?.name ?? null, feedback });
    } catch {
      // The server no longer has this question open, so show whatever comes next.
      await showNext();
    }
  }

  if (view.kind === "loading") return <p>Scouting...</p>;
  if (view.kind === "completed") return <SummaryPanel summary={view.summary} />;
  if (view.kind === "error") {
    return (
      <section className="flex flex-col gap-4">
        <p role="alert">{view.message}</p>
        <button
          type="button"
          className="border-2 border-slate-100 p-3 font-bold"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </section>
    );
  }

  const { question } = view;
  return (
    <section className="flex flex-col gap-4">
      <p className="flex justify-between text-sm">
        <span>
          Question {question.position}/{question.total}
        </span>
        <span>Kitty: {formatFee(kittyShown(view))}</span>
      </p>
      <h1 className="text-xl font-bold">{question.prompt}</h1>

      {view.kind === "question" ? (
        <>
          <TimerBar
            key={question.position}
            msRemaining={question.msRemaining}
            msTotal={GAME_RULES.answerSeconds * 1000}
            onExpire={() => void submit(question, null)}
          />
          <AnswerInput
            key={question.position}
            disabled={false}
            onPick={(player) => void submit(question, player)}
          />
        </>
      ) : (
        <FeedbackPanel
          answer={view.answer}
          feedback={view.feedback}
          isLast={question.position === question.total}
          onContinue={() => void showNext()}
        />
      )}
    </section>
  );
}

/** The kitty counts the answer just judged as soon as its feedback is on screen. */
function kittyShown(view: Extract<View, { kind: "question" | "feedback" }>): number {
  const earnedNow = view.kind === "feedback" ? view.feedback.fee : 0;
  return view.question.kittySoFar + earnedNow;
}

interface FeedbackProps {
  answer: string | null;
  feedback: AnswerFeedback;
  isLast: boolean;
  onContinue: () => void;
}

function FeedbackPanel({ answer, feedback, isLast, onContinue }: FeedbackProps) {
  return (
    <div className="flex flex-col gap-3 border-2 border-slate-100 p-4" role="status">
      <p>{outcomeLine(feedback.outcome, answer)}</p>
      <p className="text-2xl font-bold">{tierName(feedback.tier)}</p>
      <p className="text-xl">{formatFee(feedback.fee)}</p>
      {feedback.outcome === "correct" ? <p>{feedback.percent}% of players said this</p> : null}
      <button
        type="button"
        autoFocus
        className="border-2 border-amber-400 p-3 font-bold"
        onClick={onContinue}
      >
        {isLast ? "See your kitty" : "Next question"}
      </button>
    </div>
  );
}
