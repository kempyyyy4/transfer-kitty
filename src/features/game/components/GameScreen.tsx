"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FullScreenScene } from "@/components/scene/FullScreenScene";
import { GameScene } from "@/components/scene/GameScene";
import { PLAYER_SEARCH } from "@/config/rate-limits";
import { playWrongGuess } from "@/features/audio";
import { gameApi, GameApiError } from "../api-client";
import { takeDailyStart } from "../start-early";
import { bestMatch, confidentMatch } from "../best-match";
import type {
  AnswerFeedback,
  GameSummary,
  OpenQuestion,
  PlayerSuggestion,
  PlayState,
  PracticeRound,
} from "../types";
import type { AnswerDraft, WrongGuess } from "./AnswerInput";
import { PlayingView, type PracticeControls } from "./PlayingView";
import { SummaryPanel } from "./SummaryPanel";

/** The last-moment name lookup must leave time inside the server's grace period. */
const TIMEOUT_LOOKUP_MS = 800;
const EMPTY_DRAFT: AnswerDraft = { text: "", suggestions: [], chosen: null };

type View =
  | { kind: "loading" }
  | { kind: "question"; question: OpenQuestion; deadline: number }
  | {
      kind: "feedback";
      question: OpenQuestion;
      answer: string | null;
      feedback: AnswerFeedback;
      /** The player gave up on the question with SKIP. */
      skipped?: boolean;
    }
  | { kind: "completed"; sessionId: string; summary: GameSummary }
  | { kind: "error"; message: string };

function errorView(error: unknown): View {
  const message =
    error instanceof GameApiError ? error.message : "Something went wrong. Try again.";
  return { kind: "error", message };
}

/**
 * Plays a round: today's daily, or an Archive, Unlimited or pack round when `round` is given.
 * One question at a time, each judged by the server.
 */
export function GameScreen({
  round,
  practice,
  onPlayAgain,
}: {
  round?: PracticeRound;
  /** Pause, quit and the timer switch, for rounds that count for nothing. */
  practice?: PracticeControls;
  onPlayAgain?: () => void;
}) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const sessionId = useRef<string | null>(null);
  // Stops the timer running out and a click landing together from sending two answers.
  const answering = useRef(false);
  // What is in the answer box and listed under it, so it can still be sent if time runs out.
  const draft = useRef<AnswerDraft>(EMPTY_DRAFT);
  // Time ran out while a guess was with the server: close the question once it replies.
  const expiredWhileChecking = useRef(false);
  const [checking, setChecking] = useState(false);
  const [wrongGuess, setWrongGuess] = useState<WrongGuess | null>(null);
  const [wrongSoFar, setWrongSoFar] = useState<PlayerSuggestion[]>([]);

  /**
   * Shows a question or the summary. The server starts its clock somewhere between asking
   * and hearing back, so counting from the moment of asking puts this deadline at or before
   * the server's, never after.
   */
  const show = useCallback((id: string, state: PlayState, askedAt: number) => {
    answering.current = false;
    expiredWhileChecking.current = false;
    draft.current = EMPTY_DRAFT;
    setChecking(false);
    setWrongGuess(null);
    setWrongSoFar([]);
    setView(
      state.status === "completed"
        ? { kind: "completed", sessionId: id, summary: state.summary }
        : { kind: "question", question: state, deadline: askedAt + state.msRemaining },
    );
  }, []);

  const showNext = useCallback(async () => {
    const id = sessionId.current;
    if (!id) return;
    try {
      const askedAt = performance.now();
      show(id, await gameApi.next(id), askedAt);
    } catch (error) {
      setView(errorView(error));
    }
  }, [show]);

  const rememberDraft = useCallback((latest: AnswerDraft) => {
    draft.current = latest;
  }, []);

  // React runs this effect twice in development. Two starts at once, before the guest
  // cookie exists, would sign the visitor in as two different guests.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const { started: request, askedAt } = round
      ? { started: gameApi.practice(round), askedAt: performance.now() }
      : takeDailyStart();
    request
      .then((game) => {
        sessionId.current = game.sessionId;
        show(game.sessionId, game.first, askedAt);
      })
      .catch((error: unknown) => setView(errorView(error)));
  }, [show, round]);

  /**
   * Time is up: send the name in the box rather than nothing, chosen or just typed. The
   * suggestions already on screen are used when there are any; otherwise the name is looked
   * up once more, inside the moment's grace the server allows for exactly this. If that last
   * guess is wrong too, the question closes as out of time.
   */
  async function submitTyped(question: OpenQuestion) {
    if (answering.current) {
      expiredWhileChecking.current = true;
      return;
    }
    const { text, suggestions, chosen } = draft.current;
    if (chosen) return submit(question, chosen, true);
    if (text.trim().length < PLAYER_SEARCH.minQueryLength) return submit(question, null, true);

    // The list on screen can lag a keystroke behind, so it is only trusted for a clear fit.
    const shown = confidentMatch(text, suggestions);
    if (shown) return submit(question, shown, true);

    const looked = await gameApi
      .searchPlayers(text.trim(), AbortSignal.timeout(TIMEOUT_LOOKUP_MS))
      .catch(() => []);
    return submit(question, bestMatch(text, looked), true);
  }

  /**
   * Sends one guess. A right answer, or time running out, moves on to the kick; a wrong
   * guess shakes the box and the player keeps going. `timeUp` marks the last-moment guess
   * sent as the timer ends: if it is wrong, the question closes as out of time.
   */
  async function submit(
    question: OpenQuestion,
    player: PlayerSuggestion | null,
    timeUp = false,
    skipped = false,
  ) {
    const id = sessionId.current;
    if (!id || answering.current) return;
    answering.current = true;
    setChecking(true);
    try {
      const reply = await gameApi.answer(id, question.position, player?.id ?? null);
      if (reply.status === "answered") {
        const { outcome, tier, fee } = reply;
        setView({
          kind: "feedback",
          question,
          answer: player?.name ?? null,
          feedback: { outcome, tier, fee },
          skipped,
        });
        return;
      }
      answering.current = false;
      setChecking(false);
      if (player) {
        playWrongGuess();
        setWrongGuess((last) => ({
          id: (last?.id ?? 0) + 1,
          player,
          guessesLeft: reply.guessesLeft,
        }));
        setWrongSoFar((sofar) => [...sofar, player]);
      }
      if (timeUp || expiredWhileChecking.current) {
        expiredWhileChecking.current = false;
        return submit(question, null);
      }
    } catch {
      // The server no longer has this question open, so show whatever comes next.
      await showNext();
    }
  }

  if (view.kind === "loading") {
    // The round's own scene with an empty question card, filled in the moment it arrives.
    return (
      <FullScreenScene>
        <section className="relative flex h-[100dvh] flex-col px-4 pt-16 pb-4">
          <GameScene />
          <div className="pixel-panel mx-auto flex h-28 w-full max-w-2xl flex-col gap-3 p-3">
            <span className="h-2 w-12 animate-pulse bg-chalk-dim/40" />
            <span className="h-4 w-4/5 animate-pulse bg-chalk-dim/30" />
            <span className="h-4 w-2/3 animate-pulse bg-chalk-dim/30" />
          </div>
        </section>
      </FullScreenScene>
    );
  }
  if (view.kind === "completed") {
    return (
      <SummaryPanel sessionId={view.sessionId} summary={view.summary} onPlayAgain={onPlayAgain} />
    );
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
  return (
    <PlayingView
      view={view}
      practice={practice}
      checking={checking}
      wrongGuess={wrongGuess}
      wrongSoFar={wrongSoFar}
      onSubmit={(player) => void submit(question, player)}
      onSkip={() => void submit(question, null, false, true)}
      onExpire={() => void submitTyped(question)}
      onDraftChange={rememberDraft}
      onContinue={() => void showNext()}
    />
  );
}
