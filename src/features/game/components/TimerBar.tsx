"use client";

import { useEffect, useRef, useState } from "react";
import { playClockTick } from "@/features/audio";

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
 * Shows the time draining away: a bar that empties smoothly, and for the last few seconds
 * a red bar, a pulsing count and a ticking clock. It is only a display: the server judges
 * the time for itself, so stopping this bar gains a player nothing.
 * Give it a `key` per question so each question gets a fresh countdown.
 */
export function TimerBar({ deadline, msTotal, onExpire }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil(msTotal / 1000));
  const fill = useRef<HTMLDivElement>(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // The bar is one animation from wherever it starts to empty, so it moves every frame.
  useEffect(() => {
    const left = Math.max(0, deadline - performance.now());
    const drain = fill.current?.animate(
      [{ transform: `scaleX(${Math.min(1, left / msTotal)})` }, { transform: "scaleX(0)" }],
      { duration: left, easing: "linear", fill: "forwards" },
    );
    return () => drain?.cancel();
  }, [deadline, msTotal]);

  useEffect(() => {
    let lastSecond = Math.ceil(Math.max(0, deadline - performance.now()) / 1000);
    const tick = () => {
      const left = Math.max(0, deadline - performance.now());
      const second = Math.ceil(left / 1000);
      if (second !== lastSecond) {
        lastSecond = second;
        setSecondsLeft(second);
        if (second > 0 && second <= HURRY_SECONDS) playClockTick(second);
      }
      if (left === 0) {
        clearInterval(timer);
        onExpireRef.current();
      }
    };
    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, [deadline]);

  const hurry = secondsLeft <= HURRY_SECONDS;
  return (
    <div className="flex items-center gap-3">
      <div
        role="timer"
        aria-label={`${secondsLeft} seconds left`}
        className={`h-5 flex-1 border-4 bg-night-deep transition-colors duration-300 ${
          hurry ? "border-claret" : "border-chalk"
        }`}
      >
        <div
          ref={fill}
          className={`h-full origin-left transition-colors duration-300 will-change-transform ${
            hurry ? "bg-claret" : "bg-turf-light"
          }`}
        />
      </div>
      <span
        key={hurry ? secondsLeft : "calm"}
        aria-hidden
        className={`w-8 text-right font-pixel text-sm tabular-nums ${
          hurry ? "animate-tier-flash text-claret" : "text-chalk"
        }`}
      >
        {secondsLeft}
      </span>
    </div>
  );
}
