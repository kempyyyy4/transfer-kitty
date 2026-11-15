"use client";

import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { useEffect, useState } from "react";
import { gameApi } from "../api-client";
import { startDailyEarly } from "../start-early";
import type { TodayStatus } from "../types";

/** The button always says KICK OFF; underneath, a line says where today's game stands. */
const STATUS_LINES: Record<TodayStatus["played"], string | null> = {
  not_started: null,
  in_progress: "Carry on where you left off",
  completed: "See your kitty",
};

/** The big kick-off button, with the streak flame on its corner. */
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
    <div className="relative w-full max-w-sm">
      <Link
        href="/play"
        onClick={startDailyEarly}
        className="pixel-button animate-kickoff flex w-full flex-col items-center gap-2 border-floodlight px-6 py-[2.4vh] text-[clamp(1.6rem,8vw,2.4rem)] text-floodlight"
      >
        KICK OFF
        {today && STATUS_LINES[today.played] ? (
          <span className="font-mono text-xl text-chalk">
            {STATUS_LINES[today.played]}
            {today.played === "completed" ? (
              <>
                {" "}
                · next in <Countdown />
              </>
            ) : null}
          </span>
        ) : null}
      </Link>
      {today && today.streak > 0 ? <StreakBadge streak={today.streak} /> : null}
    </div>
  );
}

/** A flame and the streak, sitting on the button's corner like an app's notification. */
function StreakBadge({ streak }: { streak: number }) {
  return (
    <span
      className="absolute -top-4 -right-3 flex items-center gap-1 border-4 border-black bg-claret px-2 py-1 font-pixel text-xs text-chalk"
      aria-label={`${streak} day streak`}
    >
      <svg
        viewBox="0 0 5 6"
        shapeRendering="crispEdges"
        aria-hidden
        className="animate-flame h-5 w-4"
      >
        <rect x={2} y={0} width={1} height={1} fill="#ffd23f" />
        <rect x={1} y={1} width={3} height={1} fill="#ffb000" />
        <rect x={0} y={2} width={5} height={3} fill="#ffb000" />
        <rect x={1} y={3} width={3} height={2} fill="#ffd23f" />
        <rect x={1} y={5} width={3} height={1} fill="#e8a21c" />
      </svg>
      {streak}
    </span>
  );
}
