"use client";

import { useCallback, useState } from "react";
import { FullScreenScene } from "@/components/scene/FullScreenScene";
import { GameScene } from "@/components/scene/GameScene";
import { GAME_RULES } from "@/config/game";
import { STRAY_LEVEL, TOP_LEVEL } from "@/config/tiers";
import { playAnnoyedMeow, playCashRegister, playLionRoar } from "@/features/audio";
import { formatFee } from "@/features/scoring";
import type { AnswerFeedback, OpenQuestion, PlayerSuggestion } from "../types";
import { AnswerInput, type AnswerDraft } from "./AnswerInput";
import { AnswerReveal } from "./AnswerReveal";
import { KickStage } from "./kick/KickStage";
import { TimerBar } from "./TimerBar";

export type PlayingState =
  | { kind: "question"; question: OpenQuestion; deadline: number }
  /** Answered, and waiting for the server's verdict: Kit is already winding up. */
  | { kind: "checking"; question: OpenQuestion; answer: string | null }
  | { kind: "feedback"; question: OpenQuestion; answer: string | null; feedback: AnswerFeedback };

interface Props {
  view: PlayingState;
  onPick: (player: PlayerSuggestion) => void;
  onExpire: () => void;
  onDraftChange: (draft: AnswerDraft) => void;
  onContinue: () => void;
}

/**
 * One question on one screen, in the round's own floodlit scene: the question and answer
 * box at the top; after answering, Kit's kick down the line of tier kitties in the middle
 * and the result card at the bottom.
 */
export function PlayingView({ view, onPick, onExpire, onDraftChange, onContinue }: Props) {
  const { question } = view;
  const feedback = view.kind === "feedback" ? view.feedback : null;
  const [landedFor, setLandedFor] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const landed = landedFor === question.position;
  const kitty = question.kittySoFar + (feedback && landed ? feedback.fee : 0);

  const land = useCallback(() => {
    if (!feedback) return;
    setLandedFor(question.position);
    if (feedback.tier === STRAY_LEVEL) {
      playAnnoyedMeow();
      return;
    }
    playCashRegister();
    if (feedback.tier === TOP_LEVEL) {
      playLionRoar();
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 1600);
    }
  }, [feedback, question.position]);

  return (
    <FullScreenScene>
      <section className="relative flex h-[100dvh] flex-col gap-3 px-4 pt-16 pb-4">
        <GameScene />
        {celebrating ? <GalacticatFlash /> : null}

        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          <div className="pixel-panel flex flex-col gap-2 p-3">
            <p className="flex justify-between font-pixel text-[10px] text-chalk-dim">
              <span>
                {question.position}/{question.total}
              </span>
              <span className="text-scoreboard">KITTY {formatFee(kitty)}</span>
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

        {view.kind !== "question" ? (
          <>
            <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 items-center">
              <KickStage key={question.position} tier={feedback?.tier ?? null} onLanded={land} />
            </div>
            <div className="mx-auto w-full max-w-2xl">
              <AnswerReveal
                answer={view.answer}
                feedback={feedback}
                landed={landed}
                isLast={question.position === question.total}
                onContinue={onContinue}
              />
            </div>
          </>
        ) : null}
      </section>
    </FullScreenScene>
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
