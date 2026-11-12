"use client";

import { useEffect, useRef, useState } from "react";

const TICK_MS = 100;

interface Props {
  /** Time left when the question arrived, by the server's clock. */
  msRemaining: number;
  /** The full time for a question, which the bar is drawn against. */
  msTotal: number;
  onExpire: () => void;
}

/**
 * Shows the time draining away. It is only a display: the server judges the time for
 * itself, so stopping this bar gains a player nothing.
 * Give it a `key` per question so each question gets a fresh countdown.
 */
export function TimerBar({ msRemaining, msTotal, onExpire }: Props) {
  const [msLeft, setMsLeft] = useState(msRemaining);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const deadline = performance.now() + msRemaining;
    const timer = setInterval(() => {
      const left = Math.max(0, deadline - performance.now());
      setMsLeft(left);
      if (left === 0) {
        clearInterval(timer);
        onExpireRef.current();
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [msRemaining]);

  const secondsLeft = Math.ceil(msLeft / 1000);
  return (
    <div
      role="timer"
      aria-label={`${secondsLeft} seconds left`}
      className="h-4 w-full border-2 border-slate-100 bg-slate-800"
    >
      <div
        className="h-full bg-amber-400"
        style={{ width: `${Math.min(100, (100 * msLeft) / msTotal)}%` }}
      />
    </div>
  );
}
