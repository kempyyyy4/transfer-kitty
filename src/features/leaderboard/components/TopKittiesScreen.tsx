"use client";

import { AdSlot } from "@/features/ads";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { leaderboardApi, LeaderboardApiError } from "../api-client";
import type { Board, League, Period } from "../types";
import { BoardTable } from "./BoardTable";
import { LeaguePanel } from "./LeaguePanel";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "all", label: "All time" },
];

/** Top Kitties: today, this week and all time, for everyone or a friends league. */
export function TopKittiesScreen() {
  const [period, setPeriod] = useState<Period>("today");
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLeagues = useCallback(() => {
    leaderboardApi
      .myLeagues()
      .then(setLeagues)
      // A visitor who has never played has no leagues yet.
      .catch(() => setLeagues([]));
  }, []);

  useEffect(loadLeagues, [loadLeagues]);

  useEffect(() => {
    let current = true;
    leaderboardApi
      .board(period, leagueId)
      .then((loaded) => {
        if (current) {
          setBoard(loaded);
          setError(null);
        }
      })
      .catch((failure: unknown) => {
        if (current) {
          setError(
            failure instanceof LeaderboardApiError ? failure.message : "Could not load the board.",
          );
        }
      });
    return () => {
      current = false;
    };
  }, [period, leagueId]);

  const selected = leagues.find((league) => league.id === leagueId) ?? null;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-pixel text-lg leading-relaxed text-floodlight">TOP KITTIES</h1>

      <label className="flex flex-col gap-1 text-lg text-chalk-dim">
        Showing
        <select
          value={leagueId ?? ""}
          onChange={(event) => setLeagueId(event.target.value || null)}
          className="pixel-input p-2 text-base"
        >
          <option value="">Everyone</option>
          {leagues.map((league) => (
            <option key={league.id} value={league.id}>
              {league.name}
            </option>
          ))}
        </select>
      </label>

      <div role="tablist" className="flex gap-2">
        {PERIODS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={period === option.id}
            onClick={() => setPeriod(option.id)}
            className={`pixel-button flex-1 px-1 py-2 text-[9px] ${
              period === option.id ? "border-floodlight text-floodlight" : ""
            }`}
          >
            {option.label.toUpperCase()}
          </button>
        ))}
      </div>

      {error ? <p role="alert">{error}</p> : null}
      {board && !error ? <BoardTable board={board} /> : null}

      <LeaguePanel
        selected={selected}
        onChanged={(selectLeagueId) => {
          loadLeagues();
          setLeagueId(selectLeagueId);
        }}
      />

      <AdSlot />
      <Link href="/" className="pixel-button px-4 py-3 text-xs">
        BACK TO HOME
      </Link>
    </section>
  );
}
