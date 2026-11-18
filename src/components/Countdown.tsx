"use client";

import { useEffect, useState } from "react";
import { nextUkMidnight } from "@/lib/time/uk-day";

/** Time until the next UK midnight. Empty until the browser has told us the time. */
export function Countdown() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  if (!now) return <span>--:--:--</span>;

  const secondsLeft = Math.max(
    0,
    Math.floor((nextUkMidnight(now).getTime() - now.getTime()) / 1000),
  );
  const parts = [
    Math.floor(secondsLeft / 3600),
    Math.floor((secondsLeft % 3600) / 60),
    secondsLeft % 60,
  ];
  return <span>{parts.map((part) => String(part).padStart(2, "0")).join(":")}</span>;
}
