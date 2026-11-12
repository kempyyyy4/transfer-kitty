"use client";

import { useEffect, useState } from "react";
import { PLAYER_SEARCH } from "@/config/rate-limits";
import { gameApi } from "../api-client";
import type { PlayerSuggestion } from "../types";

/** Wait this long after the last keystroke before searching, to spare the server. */
const SEARCH_DELAY_MS = 200;

interface Props {
  disabled: boolean;
  onPick: (player: PlayerSuggestion) => void;
}

/**
 * The answer box. Suggestions come from every player in the database, whatever the
 * question, so the list never hints at who is right.
 */
export function AnswerInput({ disabled, onPick }: Props) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const query = text.trim();
  const canSearch = query.length >= PLAYER_SEARCH.minQueryLength;

  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      gameApi
        .searchPlayers(query, controller.signal)
        .then(setSuggestions)
        // A failed or cancelled search just leaves the last suggestions showing.
        .catch(() => undefined);
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, canSearch]);

  const shown = canSearch ? suggestions : [];
  const first = shown[0];

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (first && !disabled) onPick(first);
      }}
    >
      <label htmlFor="answer" className="text-sm">
        Type a player&apos;s name, then choose from the list
      </label>
      <input
        id="answer"
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={disabled}
        maxLength={PLAYER_SEARCH.maxQueryLength}
        autoComplete="off"
        autoCapitalize="words"
        autoFocus
        className="border-2 border-slate-100 bg-slate-900 p-3 text-lg"
      />
      <ul className="flex flex-col gap-1">
        {shown.map((player) => (
          <li key={player.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(player)}
              className="w-full border-2 border-slate-600 p-2 text-left hover:border-amber-400"
            >
              {player.name}
              <span className="text-sm text-slate-400">{describe(player)}</span>
            </button>
          </li>
        ))}
      </ul>
    </form>
  );
}

/** Enough to tell apart two players who share a name. */
function describe(player: PlayerSuggestion): string {
  const details = [player.country, player.birthYear ? `born ${player.birthYear}` : null].filter(
    Boolean,
  );
  return details.length > 0 ? `  ${details.join(", ")}` : "";
}
