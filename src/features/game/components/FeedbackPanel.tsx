"use client";

import { useState } from "react";
import { STRAY_LEVEL, TIERS } from "@/config/tiers";
import { TierSprite } from "@/features/avatar";
import { playAnnoyedMeow, playCashRegister, playLionRoar } from "@/features/audio";
import type { AnswerFeedback } from "../types";
import { Scoreboard } from "./Scoreboard";
import { outcomeLine, tierName } from "./tier-label";

const TOP_LEVEL = Math.max(...TIERS.map((tier) => tier.level));

interface Props {
  answer: string | null;
  feedback: AnswerFeedback;
  isLast: boolean;
  onContinue: () => void;
}

/** After each answer: the fee ticks up, the tier name flashes and its character appears. */
export function FeedbackPanel({ answer, feedback, isLast, onContinue }: Props) {
  const [counted, setCounted] = useState(false);
  const tier = TIERS.find((candidate) => candidate.level === feedback.tier);

  function finishCount() {
    setCounted(true);
    if (feedback.tier === STRAY_LEVEL) {
      playAnnoyedMeow();
      return;
    }
    playCashRegister();
    if (feedback.tier === TOP_LEVEL) playLionRoar();
  }

  return (
    <div className="pixel-panel flex flex-col items-center gap-3 p-4 text-center" role="status">
      <p className="text-xl">{outcomeLine(feedback.outcome, answer)}</p>
      <Scoreboard fee={feedback.fee} onDone={finishCount} />

      {counted ? (
        <>
          <p className="animate-tier-flash font-pixel text-lg">{tierName(feedback.tier)}</p>
          {tier ? (
            <TierSprite
              spriteKey={tier.spriteKey}
              label={tier.name}
              scale={5}
              className="animate-sprite-pop"
            />
          ) : null}
          {feedback.outcome === "correct" ? (
            <p className="text-lg text-chalk-dim">{feedback.percent}% of players said this</p>
          ) : null}
        </>
      ) : null}

      <button
        type="button"
        autoFocus
        className="pixel-button mt-2 w-full border-floodlight px-4 py-3 text-xs text-floodlight"
        onClick={onContinue}
      >
        {isLast ? "SEE YOUR KITTY" : "NEXT QUESTION"}
      </button>
    </div>
  );
}
