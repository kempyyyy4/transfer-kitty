"use client";

import { STRAY_LEVEL, TIERS } from "@/config/tiers";
import { TierSprite } from "@/features/avatar";
import { formatFee } from "@/features/scoring";
import type { AnswerFeedback } from "../types";
import { outcomeLine, tierColour, tierName } from "./tier-label";

interface Props {
  answer: string | null;
  feedback: AnswerFeedback;
  /** True once the climb for this answer has finished. */
  landed: boolean;
  isLast: boolean;
  onContinue: () => void;
}

/**
 * The card after each answer: the tier pops in straight away in its colour with what it
 * is worth, while the kitty climbs behind it. NEXT is there from the start, so nobody has
 * to wait for an animation they have seen before.
 */
export function AnswerReveal({ answer, feedback, landed, isLast, onContinue }: Props) {
  const tier = TIERS.find((candidate) => candidate.level === feedback.tier);
  const stray = feedback.tier === STRAY_LEVEL;
  const colour = tierColour(feedback.tier);

  return (
    <div
      role="status"
      className={`pixel-panel flex flex-col gap-3 p-3 ${stray ? "animate-shake" : "animate-reveal-in"}`}
      style={{ borderColor: colour }}
    >
      <div className="flex items-center gap-3">
        {tier ? (
          <TierSprite
            spriteKey={tier.spriteKey}
            label={tier.name}
            scale={3}
            className={landed ? "animate-sprite-pop" : ""}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="animate-tier-flash font-pixel text-base" style={{ color: colour }}>
            {tierName(feedback.tier).toUpperCase()}
          </p>
          <p className="text-xl leading-tight">{outcomeLine(feedback.outcome, answer)}</p>
        </div>
        <p
          className="shrink-0 font-pixel text-base text-scoreboard"
          style={{ textShadow: "0 0 8px #ffb000" }}
        >
          {stray ? "£0" : `+${formatFee(feedback.fee)}`}
        </p>
      </div>
      <button
        type="button"
        autoFocus
        className="pixel-button w-full border-floodlight px-4 py-3 text-xs text-floodlight"
        onClick={onContinue}
      >
        {isLast ? "SEE YOUR KITTY" : "NEXT QUESTION"}
      </button>
    </div>
  );
}
