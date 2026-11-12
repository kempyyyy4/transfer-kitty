"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { nextUkMidnight } from "@/lib/time/uk-day";
import { gameApi } from "../api-client";
import type { TodayStatus } from "../types";

const BUTTON_LABELS: Record<TodayStatus["played"], string> = {
  not_started: "KICK OFF",
  in_progress: "CARRY ON",
  completed: "SEE YOUR KITTY",
};

/** The home screen's live part: today's puzzle, the play button and the countdown. */
export function HomePanel() {
  const [today, setToday] = useState<TodayStatus | null>(null);

  useEffect(() => {
    gameApi
      .today()
      .then(setToday)
      // If this fails the button still works; the game screen reports real problems.
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {today ? <p>Today&apos;s puzzle: #{today.puzzleNumber}</p> : null}
      <Link href="/play" className="border-4 border-amber-400 px-8 py-4 text-2xl font-bold">
        {BUTTON_LABELS[today?.played ?? "not_started"]}
      </Link>
      <p>
        Next puzzle in <Countdown />
      </p>
      <Link href="/top-kitties" className="border-2 border-slate-100 px-6 py-2 font-bold">
        Top Kitties
      </Link>
    </div>
  );
}

/** Time until the next UK midnight. Empty until the browser has told us the time. */
function Countdown() {
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
