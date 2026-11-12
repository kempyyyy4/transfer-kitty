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
    <div className="flex w-full max-w-sm flex-col items-center gap-5">
      <p className="font-pixel text-xs text-chalk-dim">
        {today ? `PUZZLE #${today.puzzleNumber}` : " "}
      </p>
      <Link
        href="/play"
        className="pixel-button w-full border-floodlight px-6 py-5 text-xl text-floodlight"
      >
        {BUTTON_LABELS[today?.played ?? "not_started"]}
      </Link>
      <p className="text-xl">
        Next puzzle in <Countdown />
      </p>

      <nav aria-label="More" className="grid w-full grid-cols-2 gap-4">
        <Link href="/top-kitties" className="pixel-button px-2 py-3 text-[10px]">
          TOP KITTIES
        </Link>
        <Link href="/profile" className="pixel-button px-2 py-3 text-[10px]">
          PROFILE
        </Link>
        <Link href="/account" className="pixel-button px-2 py-3 text-[10px]">
          ACCOUNT
        </Link>
        {COMING_LATER.map((label) => (
          <ComingLater key={label} label={label} />
        ))}
      </nav>
    </div>
  );
}

/** Buttons for modes that later stages build. Shown now so the menu is complete. */
const COMING_LATER = ["ARCHIVE", "THEMED PACKS", "UNLIMITED", "SHOP"];

function ComingLater({ label }: { label: string }) {
  return (
    <button type="button" disabled className="pixel-button relative px-2 py-3 text-[10px]">
      {label}
      <span className="absolute -top-3 -right-2 bg-claret px-1 text-[8px] text-chalk">SOON</span>
    </button>
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
