"use client";

import { useEffect, useState } from "react";
import { PLAYER_SEARCH } from "@/config/rate-limits";

export interface PickablePlayer {
  id: number;
  name: string;
  birthYear: number | null;
  country: string | null;
}

interface Props {
  label: string;
  search: (query: string, signal: AbortSignal) => Promise<PickablePlayer[]>;
  onPick: (player: PickablePlayer) => void;
  /** Players already chosen, left out of the suggestions. */
  exclude?: ReadonlySet<number>;
}

/** Wait this long after the last keystroke before searching, to spare the server. */
const SEARCH_DELAY_MS = 250;

/** A name box with suggestions from every player in the database. */
export function PlayerPicker({ label, search, onPick, exclude }: Props) {
  const [text, setText] = useState("");
  const [found, setFound] = useState<PickablePlayer[]>([]);
  const query = text.trim();
  const canSearch = query.length >= PLAYER_SEARCH.minQueryLength;

  useEffect(() => {
    if (!canSearch) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      search(query, controller.signal)
        .then(setFound)
        .catch(() => undefined);
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, canSearch, search]);

  const shown = canSearch ? found.filter((player) => !exclude?.has(player.id)) : [];

  return (
    <div className="flex flex-col gap-1">
      <label className="flex flex-col gap-1 text-lg text-chalk-dim">
        {label}
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={PLAYER_SEARCH.maxQueryLength}
          autoComplete="off"
          className="pixel-input p-2"
        />
      </label>
      {shown.length > 0 ? (
        <ul className="flex flex-col border-2 border-stand">
          {shown.map((player) => (
            <li key={player.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(player);
                  setText("");
                  setFound([]);
                }}
                className="w-full px-2 py-1 text-left text-lg hover:bg-stand"
              >
                {player.name}
                <span className="text-chalk-dim">
                  {player.birthYear ? ` · born ${player.birthYear}` : ""}
                  {player.country ? ` · ${player.country}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
