"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_RULES } from "@/config/game";
import { STRAY_LEVEL, TOP_LEVEL } from "@/config/tiers";
import {
  playAnnoyedMeow,
  playCashRegister,
  playKick,
  playLionRoar,
  playTick,
} from "@/features/audio";
import { formatFee } from "@/features/scoring";
import type { AnswerFeedback, OpenQuestion, PlayerSuggestion } from "../types";
import { AnswerInput, type AnswerDraft } from "./AnswerInput";
import { AnswerReveal } from "./AnswerReveal";
import { ClimbWorld } from "./climb/ClimbWorld";
import { useClimb } from "./climb/use-climb";
import { tierColour } from "./tier-label";
import { TimerBar } from "./TimerBar";

/** A tick plays each time the kitty passes another £25m. */
const TICK_EVERY = 25_000_000;

export type PlayingState =
  | { kind: "question"; question: OpenQuestion; deadline: number }
  | { kind: "feedback"; question: OpenQuestion; answer: string | null; feedback: AnswerFeedback };

interface Props {
  view: PlayingState;
  onPick: (player: PlayerSuggestion) => void;
  onExpire: () => void;
  onDraftChange: (draft: AnswerDraft) => void;
  onContinue: () => void;
}

/**
 * One question on one screen, no scrolling: the question and answer box at the top, Kit
 * in the middle of the climb, and after answering, the result card at the bottom while the
 * kitty climbs to its new height.
 */
export function PlayingView({ view, onPick, onExpire, onDraftChange, onContinue }: Props) {
  const { question } = view;
  const feedback = view.kind === "feedback" ? view.feedback : null;
  const target = question.kittySoFar + (feedback?.fee ?? 0);
  const [landedFor, setLandedFor] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const land = useCallback(() => {
    if (!feedback) return;
    setLandedFor(question.position);
    if (feedback.tier === STRAY_LEVEL) return;
    playCashRegister();
    if (feedback.tier === TOP_LEVEL) {
      playLionRoar();
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 1600);
    }
  }, [feedback, question.position]);

  const height = useClimb(target, land);
  const climbing = Math.abs(height - target) > 1;

  // The kick, or the meow, as soon as the answer is judged.
  useEffect(() => {
    if (!feedback) return;
    if (feedback.tier === STRAY_LEVEL) {
      playAnnoyedMeow();
      const settle = setTimeout(() => setLandedFor(question.position), 0);
      return () => clearTimeout(settle);
    }
    playKick();
  }, [feedback, question.position]);

  // A tick for every £25m passed on the way up.
  const lastTick = useRef(Math.floor(height / TICK_EVERY));
  useEffect(() => {
    const step = Math.floor(height / TICK_EVERY);
    if (step > lastTick.current) playTick(Math.min(7, step % 8));
    lastTick.current = step;
  }, [height]);

  return (
    <section className="fixed inset-0 flex h-[100dvh] flex-col justify-between gap-3 px-4 pt-16 pb-4">
      <ClimbWorld height={height} moving={climbing} />
      {celebrating ? <GalacticatFlash /> : null}
      {feedback && feedback.fee > 0 ? (
        <FeeFloat key={question.position} fee={feedback.fee} colour={tierColour(feedback.tier)} />
      ) : null}

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        <div className="pixel-panel flex flex-col gap-2 p-3">
          <p className="flex justify-between font-pixel text-[10px] text-chalk-dim">
            <span>
              {question.position}/{question.total}
            </span>
            <span className="text-scoreboard">KITTY {formatFee(Math.round(height))}</span>
          </p>
          <h1 className="text-2xl leading-tight">{question.prompt}</h1>
        </div>

        {view.kind === "question" ? (
          <>
            <TimerBar
              key={`timer-${question.position}`}
              deadline={view.deadline}
              msTotal={GAME_RULES.answerSeconds * 1000}
              onExpire={onExpire}
            />
            <AnswerInput
              key={`answer-${question.position}`}
              disabled={false}
              onPick={onPick}
              onDraftChange={onDraftChange}
            />
          </>
        ) : null}
      </div>

      {view.kind === "feedback" ? (
        <div className="mx-auto w-full max-w-2xl">
          <AnswerReveal
            answer={view.answer}
            feedback={view.feedback}
            landed={landedFor === question.position}
            isLast={question.position === question.total}
            onContinue={onContinue}
          />
        </div>
      ) : null}
    </section>
  );
}

/** A gold flash and falling confetti when a Galacticat lands. */
function GalacticatFlash() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      <div className="animate-gold-flash absolute inset-0 bg-floodlight" />
      {Array.from({ length: 28 }, (_, index) => (
        <span
          key={index}
          className="animate-confetti absolute top-0 h-2 w-2"
          style={{
            left: `${(index * 37) % 100}%`,
            backgroundColor: ["#ffd23f", "#ff8a1f", "#f2f4ff", "#3fd17a"][index % 4],
            animationDelay: `${(index % 7) * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}

/** The fee rising from Kit as the kitty climbs, in the tier's colour. */
function FeeFloat({ fee, colour }: { fee: number; colour: string }) {
  return (
    <p
      aria-hidden
      className="animate-fee-float pointer-events-none fixed bottom-[40vh] left-1/2 z-20 -translate-x-1/2 font-pixel text-3xl"
      style={{ color: colour, textShadow: "4px 4px 0 #000" }}
    >
      +{formatFee(fee)}
    </p>
  );
}
