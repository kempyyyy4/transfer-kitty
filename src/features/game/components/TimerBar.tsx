"use client";

import { useEffect, useRef, useState } from "react";

const TICK_MS = 100;
const HURRY_SECONDS = 5;

interface Props {
  /** When time runs out, on the browser's performance.now() clock. */
  deadline: number;
  /** The full time for a question, which the bar is drawn against. */
  msTotal: number;
  onExpire: () => void;
}

/**
 * Shows the time draining away. It is only a display: the server judges the time for
 * itself, so stopping this bar gains a player nothing.
 * Give it a `key` per question so each question gets a fresh countdown.
 */
export function TimerBar({ deadline, msTotal, onExpire }: Props) {
  const [msLeft, setMsLeft] = useState(msTotal);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, deadline - performance.now());
      setMsLeft(left);
      if (left === 0) {
        clearInterval(timer);
        onExpireRef.current();
      }
    };
    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, [deadline]);

  const secondsLeft = Math.ceil(msLeft / 1000);
  // The bar turns red for the last few seconds.
  const hurry = secondsLeft <= HURRY_SECONDS;
  return (
    <div className="flex items-center gap-2">
      <div
        role="timer"
        aria-label={`${secondsLeft} seconds left`}
        className="h-6 flex-1 border-4 border-chalk bg-night-deep"
      >
        <div
          className={`h-full ${hurry ? "bg-claret" : "bg-turf-light"}`}
          style={{ width: `${Math.min(100, (100 * msLeft) / msTotal)}%` }}
        />
      </div>
      <span
        aria-hidden
        className={`w-8 text-right font-pixel text-xs ${hurry ? "text-claret" : ""}`}
      >
        {secondsLeft}
      </span>
    </div>
  );
}
