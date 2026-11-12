"use client";

import { useEffect, useRef, useState } from "react";
import { formatFee } from "@/features/scoring";

const COUNT_MS = 900;
const STEPS = 12;

/**
 * A pixel scoreboard that ticks a fee up from nothing, in steps like an old dot display.
 * Calls `onDone` once it reaches the full fee.
 */
export function Scoreboard({ fee, onDone }: { fee: number; onDone?: () => void }) {
  const [shown, setShown] = useState(0);
  // Held in a ref so a new onDone each render does not restart the count.
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setShown(Math.round((fee * step) / STEPS));
      if (step >= STEPS) {
        clearInterval(timer);
        onDoneRef.current?.();
      }
    }, COUNT_MS / STEPS);
    return () => clearInterval(timer);
  }, [fee]);

  return (
    <div
      aria-live="polite"
      aria-label={`Transfer fee ${formatFee(fee)}`}
      className="border-4 border-stand bg-black px-4 py-3 font-pixel text-2xl text-scoreboard"
      style={{ textShadow: "0 0 6px #ffb000" }}
    >
      {formatFee(shown)}
    </div>
  );
}
