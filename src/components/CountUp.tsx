"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number;
  format: (value: number) => string;
  durationMs?: number;
}

/** A number that rolls up from zero when it first appears, easing into place. */
export function CountUp({ value, format, durationMs = 1400 }: Props) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const jump = setTimeout(() => setShown(value), 0);
      return () => clearTimeout(jump);
    }
    let began = 0;
    let frame = requestAnimationFrame(function step(now) {
      began ||= now;
      const t = Math.min(1, (now - began) / durationMs);
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <>{format(Math.round(shown))}</>;
}
