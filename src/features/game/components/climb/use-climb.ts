"use client";

import { useEffect, useRef, useState } from "react";

/** Quick off the boot, then a long slow drift into place. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/** A short hop for a cheap answer, a long climb for a big one. */
function durationFor(gainedPounds: number): number {
  const millions = gainedPounds / 1_000_000;
  return 700 + Math.min(1, millions / 100) * 2600;
}

/**
 * The height shown, in pounds, easing smoothly towards `target` whenever it changes.
 * `onArrive` is called once each climb ends. With reduced motion the height jumps.
 */
export function useClimb(target: number, onArrive?: () => void): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const onArriveRef = useRef(onArrive);

  useEffect(() => {
    onArriveRef.current = onArrive;
  }, [onArrive]);

  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = target;
      const jump = setTimeout(() => {
        setShown(target);
        onArriveRef.current?.();
      }, 0);
      return () => clearTimeout(jump);
    }

    const duration = durationFor(target - start);
    let began = 0;
    let frame = requestAnimationFrame(function step(now) {
      began ||= now;
      const t = Math.min(1, (now - began) / duration);
      const value = start + (target - start) * easeOut(t);
      from.current = value;
      setShown(value);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        from.current = target;
        onArriveRef.current?.();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}
