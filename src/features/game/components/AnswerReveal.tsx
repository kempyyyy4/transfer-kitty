"use client";

import { STRAY_LEVEL, TIERS } from "@/config/tiers";
import { TierSprite } from "@/features/avatar";
import { formatFee } from "@/features/scoring";
import type { AnswerFeedback } from "../types";
import { outcomeLine, tierColour, tierName } from "./tier-label";

interface Props {
  answer: string | null;
  feedback: AnswerFeedback;
  /** True once the receiving kitty has the ball: the tier and fee are kept back until then. */
  landed: boolean;
  isLast: boolean;
  onContinue: () => void;
}

/**
 * The card under the kick. Your answer shows straight away; the tier and its fee pop in
 * once the kitty has the ball, so the kick keeps its suspense. NEXT is always there, for
 * anyone who would rather not wait.
 */
export function AnswerReveal({ answer, feedback, landed, isLast, onContinue }: Props) {
  const tier = TIERS.find((candidate) => candidate.level === feedback.tier);
  const stray = feedback.tier === STRAY_LEVEL;
  const colour = tierColour(feedback.tier);

  return (
    <div
      role="status"
      className={`pixel-panel flex flex-col gap-3 p-3 transition-colors duration-300 ${
        landed && stray ? "animate-shake" : "animate-reveal-in"
      }`}
      style={{ borderColor: landed ? colour : undefined }}
    >
      <div className="flex min-h-5 items-baseline justify-between gap-3">
        {landed ? (
          <>
            <p className="animate-tier-flash min-w-0 font-pixel text-xs" style={{ color: colour }}>
              {tierName(feedback.tier).toUpperCase()}
            </p>
            <p
              className="animate-tier-flash shrink-0 font-pixel text-sm text-scoreboard"
              style={{ textShadow: "0 0 8px #ffb000" }}
            >
              {stray ? "£0" : `+${formatFee(feedback.fee)}`}
            </p>
          </>
        ) : null}
      </div>
      <div className="flex min-h-12 items-center gap-3">
        {landed && tier ? (
          <TierSprite
            spriteKey={tier.spriteKey}
            label={tier.name}
            scale={3}
            className="animate-sprite-pop"
          />
        ) : null}
        <p className="min-w-0 flex-1 text-xl leading-tight">
          {outcomeLine(feedback.outcome, answer)}
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
