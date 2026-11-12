"use client";

import { useState, type FormEvent } from "react";
import { LEAGUES } from "@/config/leaderboard";
import { leaderboardApi, LeaderboardApiError } from "../api-client";
import type { League } from "../types";

interface Props {
  selected: League | null;
  /** Called after any change, so the screen can reload the league list. */
  onChanged: (selectLeagueId: string | null) => void;
}

const errorMessage = (error: unknown) =>
  error instanceof LeaderboardApiError ? error.message : "Something went wrong. Try again.";

/** Create a league, join one by code, and share or leave the one being viewed. */
export function LeaguePanel({ selected, onChanged }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: () => Promise<string | null>) {
    setMessage(null);
    try {
      onChanged(await action());
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  function create(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const league = await leaderboardApi.createLeague(name);
      setName("");
      return league.id;
    });
  }

  function join(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const joined = await leaderboardApi.joinLeague(code);
      setCode("");
      return joined.leagueId;
    });
  }

  return (
    <section className="flex flex-col gap-4 border-2 border-slate-600 p-3">
      {selected ? (
        <div className="flex flex-col gap-2">
          <p>
            Invite code for {selected.name}:{" "}
            <strong className="tracking-widest">{selected.inviteCode}</strong>
          </p>
          <p className="text-sm text-slate-400">
            Share it with friends so they can join. {selected.members}{" "}
            {selected.members === 1 ? "member" : "members"}.
          </p>
          <button
            type="button"
            className="self-start border-2 border-slate-600 px-3 py-1 text-sm hover:border-red-400"
            onClick={() =>
              void run(async () => {
                await leaderboardApi.leaveLeague(selected.id);
                return null;
              })
            }
          >
            Leave this league
          </button>
        </div>
      ) : null}

      <form onSubmit={join} className="flex flex-col gap-1">
        <label htmlFor="join-code" className="text-sm">
          Join a league with an invite code
        </label>
        <div className="flex gap-2">
          <input
            id="join-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={12}
            autoComplete="off"
            className="min-w-0 flex-1 border-2 border-slate-100 bg-slate-900 p-2 uppercase"
          />
          <button type="submit" className="border-2 border-amber-400 px-3 font-bold">
            Join
          </button>
        </div>
      </form>

      <form onSubmit={create} className="flex flex-col gap-1">
        <label htmlFor="league-name" className="text-sm">
          Start a new league
        </label>
        <div className="flex gap-2">
          <input
            id="league-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={LEAGUES.nameMinLength}
            maxLength={LEAGUES.nameMaxLength}
            autoComplete="off"
            className="min-w-0 flex-1 border-2 border-slate-100 bg-slate-900 p-2"
          />
          <button type="submit" className="border-2 border-amber-400 px-3 font-bold">
            Create
          </button>
        </div>
      </form>

      {message ? <p role="alert">{message}</p> : null}
    </section>
  );
}
