"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { GameScreen } from "@/features/game";
import { LifetimeCard, useAccess } from "@/features/payments";
import { modesApi } from "../api-client";
import type { ArchiveDay } from "../types";

function readableDate(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Every past daily puzzle. Lifetime players can replay any of them. */
export function ArchiveScreen() {
  const access = useAccess();
  const [days, setDays] = useState<ArchiveDay[] | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    modesApi
      .archive()
      .then(setDays)
      .catch(() => setDays([]));
  }, []);

  if (playing) return <GameScreen round={{ mode: "archive", date: playing }} />;
  const unlocked = access?.lifetime === true;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-pixel text-lg leading-relaxed text-floodlight">ARCHIVE</h1>
      <p className="text-xl">
        Every past day&apos;s puzzle. Replays are just for fun: no Top Kitties, no coins.
      </p>
      {access && !unlocked ? <LifetimeCard /> : null}
      {days === null || access === null ? <Loader /> : null}
      {days?.length === 0 ? <p>No past puzzles yet. Come back tomorrow.</p> : null}
      {days && access ? (
        <ul className="flex flex-col gap-2">
          {days.map((day) => (
            <li key={day.date} className="pixel-panel flex items-center justify-between gap-2 p-2">
              <span>
                <span className="font-pixel text-[10px] text-floodlight">#{day.number}</span>{" "}
                {readableDate(day.date)}
                {day.played ? <span className="text-chalk-dim"> · played</span> : null}
              </span>
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => setPlaying(day.date)}
                className="pixel-button px-2 py-1 text-[10px]"
              >
                PLAY
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Link href="/" className="pixel-button px-4 py-3 text-xs">
        BACK TO HOME
      </Link>
    </section>
  );
}
