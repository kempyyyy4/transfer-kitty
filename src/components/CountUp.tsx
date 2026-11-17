"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number;
  format: (value: number) => string;
  durationMs?: number;
  /** Where the roll starts: zero unless the number is going up from an old value. */
  from?: number;
}

/** A number that rolls up when it first appears, easing into place. */
export function CountUp({ value, format, durationMs = 1400, from = 0 }: Props) {
  const [shown, setShown] = useState(from);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const jump = setTimeout(() => setShown(value), 0);
      return () => clearTimeout(jump);
    }
    let began = 0;
    let frame = requestAnimationFrame(function step(now) {
      began ||= now;
      const t = Math.min(1, (now - began) / durationMs);
      setShown(from + (value - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, from]);

  return <>{format(Math.round(shown))}</>;
}
