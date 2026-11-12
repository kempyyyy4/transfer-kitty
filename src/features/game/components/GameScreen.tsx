"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader } from "@/components/Loader";
import { GAME_RULES } from "@/config/game";
import { PLAYER_SEARCH } from "@/config/rate-limits";
import { formatFee } from "@/features/scoring";
import { gameApi, GameApiError } from "../api-client";
import { bestMatch, confidentMatch } from "../best-match";
import type { AnswerFeedback, GameSummary, OpenQuestion, PlayerSuggestion } from "../types";
import { AnswerInput, type AnswerDraft } from "./AnswerInput";
import { FeedbackPanel } from "./FeedbackPanel";
import { KittyGauge } from "./KittyGauge";
import { SummaryPanel } from "./SummaryPanel";
import { TimerBar } from "./TimerBar";

/** The last-moment name lookup must leave time inside the server's grace period. */
const TIMEOUT_LOOKUP_MS = 800;
const EMPTY_DRAFT: AnswerDraft = { text: "", suggestions: [] };

type View =
  | { kind: "loading" }
  | { kind: "question"; question: OpenQuestion; deadline: number }
  | { kind: "feedback"; question: OpenQuestion; answer: string | null; feedback: AnswerFeedback }
  | { kind: "completed"; sessionId: string; summary: GameSummary }
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
  // What is in the answer box and listed under it, so it can still be sent if time runs out.
  const draft = useRef<AnswerDraft>(EMPTY_DRAFT);

  const showNext = useCallback(async () => {
    const id = sessionId.current;
    if (!id) return;
    try {
      // The server starts its clock somewhere between asking and hearing back. Counting
      // from the moment of asking puts this deadline at or before the server's, never after.
      const askedAt = performance.now();
      const state = await gameApi.next(id);
      answering.current = false;
      draft.current = EMPTY_DRAFT;
      setView(
        state.status === "completed"
          ? { kind: "completed", sessionId: id, summary: state.summary }
          : { kind: "question", question: state, deadline: askedAt + state.msRemaining },
      );
    } catch (error) {
      setView(errorView(error));
    }
  }, []);

  const rememberDraft = useCallback((latest: AnswerDraft) => {
    draft.current = latest;
  }, []);

  // React runs this effect twice in development. Two starts at once, before the guest
  // cookie exists, would sign the visitor in as two different guests.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    gameApi
      .start()
      .then((game) => {
        sessionId.current = game.sessionId;
        return showNext();
      })
      .catch((error: unknown) => setView(errorView(error)));
  }, [showNext]);

  /**
   * Time is up: send whatever name is in the box rather than nothing. The suggestions
   * already on screen are used when there are any; otherwise the name is looked up once
   * more, inside the moment's grace the server allows for exactly this.
   */
  async function submitTyped(question: OpenQuestion) {
    if (answering.current) return;
    const { text, suggestions } = draft.current;
    if (text.trim().length < PLAYER_SEARCH.minQueryLength) return submit(question, null);

    // The list on screen can lag a keystroke behind, so it is only trusted for a clear fit.
    const shown = confidentMatch(text, suggestions);
    if (shown) return submit(question, shown);

    const looked = await gameApi
      .searchPlayers(text.trim(), AbortSignal.timeout(TIMEOUT_LOOKUP_MS))
      .catch(() => []);
    return submit(question, bestMatch(text, looked));
  }

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

  if (view.kind === "loading") return <Loader />;
  if (view.kind === "completed") {
    return <SummaryPanel sessionId={view.sessionId} summary={view.summary} />;
  }
  if (view.kind === "error") {
    return (
      <section className="pixel-panel flex flex-col gap-4 p-4">
        <p role="alert" className="text-xl">
          {view.message}
        </p>
        <button
          type="button"
          className="pixel-button px-4 py-3 text-xs"
          onClick={() => window.location.reload()}
        >
          TRY AGAIN
        </button>
      </section>
    );
  }

  const { question } = view;
  const kitty = kittyShown(view);
  return (
    <section className="flex gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <p className="flex justify-between font-pixel text-[10px] text-chalk-dim">
          <span>
            {question.position}/{question.total}
          </span>
          <span className="text-floodlight">KITTY {formatFee(kitty)}</span>
        </p>
        <h1 className="text-2xl leading-tight">{question.prompt}</h1>

        {view.kind === "question" ? (
          <>
            <TimerBar
              key={`timer-${question.position}`}
              deadline={view.deadline}
              msTotal={GAME_RULES.answerSeconds * 1000}
              onExpire={() => void submitTyped(question)}
            />
            <AnswerInput
              key={`answer-${question.position}`}
              disabled={false}
              onPick={(player) => void submit(question, player)}
              onDraftChange={rememberDraft}
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
      </div>
      <KittyGauge kitty={kitty} />
    </section>
  );
}

/** The kitty counts the answer just judged as soon as its feedback is on screen. */
function kittyShown(view: Extract<View, { kind: "question" | "feedback" }>): number {
  const earnedNow = view.kind === "feedback" ? view.feedback.fee : 0;
  return view.question.kittySoFar + earnedNow;
}
