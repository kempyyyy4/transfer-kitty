"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { leaderboardApi } from "../api-client";
import type { Board } from "../types";
import { SignInToAppear } from "./SignInToAppear";

/** "#412 of 9,870" for today's game, on the Results screen. It moves as others finish. */
export function YourRank() {
  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    leaderboardApi
      .board("today", null)
      .then(setBoard)
      // The rank is a bonus on the Results screen; without it the results still show.
      .catch(() => undefined);
  }, []);

  if (!board?.you) return null;
  return (
    <>
      <RankLine board={board} you={board.you} />
      {board.signInToAppear ? <SignInToAppear /> : null}
    </>
  );
}

function RankLine({ board, you }: { board: Board; you: NonNullable<Board["you"]> }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-3">
      <span className="text-xl">
        Today&apos;s rank: <strong>#{you.rank.toLocaleString("en-GB")}</strong> of{" "}
        {board.players.toLocaleString("en-GB")}
      </span>
      <Link href="/top-kitties" className="text-sm underline">
        See Top Kitties
      </Link>
    </p>
  );
}
