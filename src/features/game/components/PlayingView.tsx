"use client";

import { useCallback, useState } from "react";
import { CountUp } from "@/components/CountUp";
import { FullScreenScene } from "@/components/scene/FullScreenScene";
import { GameScene } from "@/components/scene/GameScene";
import { GAME_RULES } from "@/config/game";
import { STRAY_LEVEL, TOP_LEVEL } from "@/config/tiers";
import {
  buzz,
  playAnnoyedMeow,
  playCashRegister,
  playLionRoar,
  playSelect,
} from "@/features/audio";
import { formatFee } from "@/features/scoring";
import type { AnswerFeedback, OpenQuestion, PlayerSuggestion } from "../types";
import { AnswerInput, type AnswerDraft, type WrongGuess } from "./AnswerInput";
import { AnswerReveal } from "./AnswerReveal";
import { KickStage } from "./kick/KickStage";
import { tierColour } from "./tier-label";
import { TimerBar } from "./TimerBar";

export type PlayingState =
  | { kind: "question"; question: OpenQuestion; deadline: number }
  | { kind: "feedback"; question: OpenQuestion; answer: string | null; feedback: AnswerFeedback };

/** For rounds that count for nothing: the player may pause, quit, or play without a timer. */
export interface PracticeControls {
  timed: boolean;
  onQuit: () => void;
}

interface Props {
  view: PlayingState;
  checking: boolean;
  wrongGuess: WrongGuess | null;
  wrongSoFar: readonly PlayerSuggestion[];
  practice?: PracticeControls;
  onSubmit: (player: PlayerSuggestion) => void;
  onExpire: () => void;
  onDraftChange: (draft: AnswerDraft) => void;
  onContinue: () => void;
}

/**
 * One question on one screen, in the round's own floodlit scene: the question and answer
 * box at the top; after answering, Kit's kick down the line of tier kitties in the middle
 * and the result card at the bottom.
 */
export function PlayingView({
  view,
  checking,
  wrongGuess,
  wrongSoFar,
  practice,
  onSubmit,
  onExpire,
  onDraftChange,
  onContinue,
}: Props) {
  const { question } = view;
  /** When the pause began, or null while playing. Practice rounds only. */
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  /** Time spent paused on this question, which pushes the deadline back. */
  const [pausedMs, setPausedMs] = useState<{ position: number; ms: number }>({
    position: 0,
    ms: 0,
  });
  const extraMs = pausedMs.position === question.position ? pausedMs.ms : 0;
  const feedback = view.kind === "feedback" ? view.feedback : null;
  const [landedFor, setLandedFor] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  /** The tier of each question answered on this screen, for the progress pips. */
  const [tiers, setTiers] = useState<Record<number, number>>({});
  /** Set the moment NEXT is pressed, so the old answer clears before the server replies. */
  const [leavingFrom, setLeavingFrom] = useState<number | null>(null);
  const landed = landedFor === question.position;
  const leaving = leavingFrom === question.position;
  const kitty = question.kittySoFar + (feedback && landed ? feedback.fee : 0);

  const land = useCallback(() => {
    if (!feedback) return;
    setLandedFor(question.position);
    setTiers((known) => ({ ...known, [question.position]: feedback.tier }));
    if (feedback.tier === STRAY_LEVEL) {
      playAnnoyedMeow();
      return;
    }
    playCashRegister();
    if (feedback.tier === TOP_LEVEL) {
      playLionRoar();
      buzz([40, 60, 40, 60, 120]);
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 1600);
    }
  }, [feedback, question.position]);

  return (
    <FullScreenScene>
      <section className="relative flex h-[100dvh] flex-col gap-3 overflow-y-auto px-4 pt-16 pb-4 [@media(max-height:560px)]:gap-2 [@media(max-height:560px)]:pt-14">
        <GameScene />
        {celebrating ? <GalacticatFlash /> : null}

        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 [@media(max-height:560px)]:gap-2">
          <div className="pixel-panel flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between gap-3">
              <Pips total={question.total} current={question.position} tiers={tiers} />
              <p className="font-pixel text-[10px] text-scoreboard">
                KITTY{" "}
                {landed && feedback && feedback.fee > 0 ? (
                  <span key={kitty} className="animate-tier-flash inline-block">
                    <CountUp
                      value={kitty}
                      from={question.kittySoFar}
                      format={formatFee}
                      durationMs={700}
                    />
                  </span>
                ) : (
                  formatFee(kitty)
                )}
              </p>
            </div>
            <h1
              key={question.position}
              className={`animate-question-in text-2xl leading-tight transition-opacity duration-200 [@media(max-height:560px)]:text-xl ${
                leaving ? "opacity-40" : ""
              }`}
            >
              {pausedAt === null ? question.prompt : "Paused. The question is hidden."}
            </h1>
          </div>

          {view.kind === "question" && pausedAt !== null ? (
            <PausedPanel
              onResume={() => {
                setPausedMs({
                  position: question.position,
                  ms: extraMs + performance.now() - pausedAt,
                });
                setPausedAt(null);
              }}
              onQuit={() => practice?.onQuit()}
            />
          ) : null}
          {view.kind === "question" && pausedAt === null ? (
            <>
              {practice ? (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPausedAt(performance.now())}
                    className="pixel-button px-3 py-2 text-[10px]"
                  >
                    PAUSE
                  </button>
                  <button
                    type="button"
                    onClick={practice.onQuit}
                    className="pixel-button px-3 py-2 text-[10px]"
                  >
                    QUIT
                  </button>
                </div>
              ) : null}
              {practice?.timed === false ? null : (
                <TimerBar
                  key={`timer-${question.position}-${extraMs}`}
                  deadline={view.deadline + extraMs}
                  msTotal={GAME_RULES.answerSeconds * 1000}
                  onExpire={onExpire}
                />
              )}
              <AnswerInput
                key={`answer-${question.position}`}
                checking={checking}
                wrongGuess={wrongGuess}
                wrongSoFar={wrongSoFar}
                onSubmit={(player) => {
                  playSelect();
                  onSubmit(player);
                }}
                onDraftChange={onDraftChange}
              />
            </>
          ) : null}
        </div>

        {view.kind !== "question" ? (
          <div
            className={`flex min-h-0 flex-1 flex-col gap-3 transition-[opacity,translate] duration-200 ease-out ${
              leaving ? "translate-y-3 opacity-0" : ""
            }`}
          >
            <div className="mx-auto flex max-h-[300px] min-h-0 w-full max-w-2xl flex-1 items-center">
              <KickStage key={question.position} tier={feedback?.tier ?? null} onLanded={land} />
            </div>
            <div className="mx-auto w-full max-w-2xl">
              <AnswerReveal
                answer={view.answer}
                feedback={feedback}
                landed={landed}
                isLast={question.position === question.total}
                onContinue={() => {
                  setLeavingFrom(question.position);
                  onContinue();
                }}
              />
            </div>
          </div>
        ) : null}
      </section>
    </FullScreenScene>
  );
}

/**
 * The round's progress: one square per question, filled in its tier's colour once
 * answered, the current one lit. Answers from before a reload show plain.
 */
function Pips({
  total,
  current,
  tiers,
}: {
  total: number;
  current: number;
  tiers: Record<number, number>;
}) {
  return (
    <div className="flex items-center gap-1" aria-label={`Question ${current} of ${total}`}>
      {Array.from({ length: total }, (_, index) => {
        const position = index + 1;
        const tier = tiers[position];
        const colour =
          tier !== undefined
            ? tierColour(tier)
            : position < current
              ? "var(--color-chalk-dim)"
              : undefined;
        return (
          <span
            key={position}
            className={`h-2.5 w-2.5 border-2 border-black transition-colors duration-300 ${
              position === current && tier === undefined ? "animate-pulse bg-floodlight" : ""
            } ${colour === undefined && position !== current ? "bg-stand" : ""}`}
            style={colour ? { backgroundColor: colour } : undefined}
          />
        );
      })}
    </div>
  );
}

/** Shown while a practice round is paused: the question stays hidden until it resumes. */
function PausedPanel({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  return (
    <div className="pixel-panel animate-reveal-in flex flex-col items-center gap-3 p-5 text-center">
      <p className="font-pixel text-base text-floodlight">PAUSED</p>
      <p className="text-lg text-chalk-dim">The clock has stopped. Take your time.</p>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <button
          type="button"
          autoFocus
          onClick={onResume}
          className="pixel-button flex-1 border-floodlight bg-floodlight px-4 py-3 text-xs text-night-deep hover:text-night-deep"
        >
          RESUME
        </button>
        <button type="button" onClick={onQuit} className="pixel-button flex-1 px-4 py-3 text-xs">
          QUIT ROUND
        </button>
      </div>
    </div>
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
