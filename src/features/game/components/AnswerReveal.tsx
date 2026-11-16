"use client";

import { STRAY_LEVEL } from "@/config/tiers";
import { formatFee } from "@/features/scoring";
import type { AnswerFeedback } from "../types";
import { outcomeLine, tierColour, tierName } from "./tier-label";

interface Props {
  answer: string | null;
  /** Null while the server is still checking the answer. */
  feedback: AnswerFeedback | null;
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
  const level = feedback?.tier ?? STRAY_LEVEL;
  const stray = level === STRAY_LEVEL;
  const colour = tierColour(level);

  return (
    <div
      role="status"
      className={`pixel-panel flex flex-col gap-3 p-3 transition-colors duration-300 ${
        landed && stray ? "animate-shake" : "animate-reveal-in"
      }`}
      style={{ borderColor: landed ? colour : undefined }}
    >
      <div className="flex min-h-5 items-baseline justify-between gap-3">
        {landed && feedback ? (
          <>
            <p className="animate-tier-flash min-w-0 font-pixel text-sm" style={{ color: colour }}>
              {tierName(level).toUpperCase()}
            </p>
            <p
              className="animate-tier-flash shrink-0 font-pixel text-lg text-scoreboard"
              style={{ textShadow: "0 0 8px #ffb000" }}
            >
              {stray ? "£0" : `+${formatFee(feedback?.fee ?? 0)}`}
            </p>
          </>
        ) : null}
      </div>
      <p className="text-xl leading-tight">
        {feedback ? outcomeLine(feedback.outcome, answer) : (answer ?? "Out of time")}
      </p>
      <button
        type="button"
        autoFocus
        aria-disabled={!feedback}
        className="pixel-button w-full border-floodlight px-4 py-3 text-xs text-floodlight"
        onClick={() => {
          if (feedback) onContinue();
        }}
      >
        {isLast ? "SEE YOUR KITTY" : "NEXT QUESTION"}
      </button>
    </div>
  );
}
