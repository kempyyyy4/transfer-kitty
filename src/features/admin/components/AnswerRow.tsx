"use client";

import { useState } from "react";
import type { AdminQuestionDetail } from "../types";
import { TierSelect, tierLabel } from "./TierSelect";

type Answer = AdminQuestionDetail["answers"][number];

interface Props {
  answer: Answer;
  disabled: boolean;
  onOverride: (tier: number | null) => void;
  onRemove: () => void;
}

/** One valid answer: its tiers, how often it was given, and the admin's controls. */
export function AnswerRow({ answer, disabled, onOverride, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="flex flex-col gap-1 border-b-2 border-stand py-2">
      <p className="text-lg">
        {answer.name}
        <span className="text-chalk-dim">
          {answer.birthYear ? ` · born ${answer.birthYear}` : ""} · given {answer.timesGiven}
        </span>
      </p>
      <p className="text-chalk-dim">
        Started {tierLabel(answer.startingTier)} · now {tierLabel(answer.currentTier)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <TierSelect
          label={`Override tier for ${answer.name}`}
          value={answer.override}
          emptyLabel="No override"
          disabled={disabled}
          onChange={onOverride}
        />
        {confirming ? (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setConfirming(false);
                onRemove();
              }}
              className="pixel-button px-2 py-1 text-[10px] border-claret text-claret"
            >
              YES, REMOVE
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="pixel-button px-2 py-1 text-[10px]"
            >
              KEEP
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setConfirming(true)}
            className="pixel-button px-2 py-1 text-[10px] hover:border-claret hover:text-claret"
          >
            REMOVE
          </button>
        )}
      </div>
    </li>
  );
}
