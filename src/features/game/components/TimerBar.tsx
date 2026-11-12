"use client";

import { useEffect, useRef, useState } from "react";

const TICK_MS = 100;

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
