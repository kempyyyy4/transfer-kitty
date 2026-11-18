"use client";

import { useEffect, useMemo, useState } from "react";
import { PLAYER_SEARCH } from "@/config/rate-limits";
import { gameApi } from "../api-client";
import { bestMatch } from "../best-match";
import type { PlayerSuggestion } from "../types";

/** Wait this long after the last keystroke before searching, to spare the server. */
const SEARCH_DELAY_MS = 200;

interface Props {
  disabled: boolean;
  onPick: (player: PlayerSuggestion) => void;
  /** Reports what is typed and suggested, so it can still be sent if time runs out. */
  onDraftChange: (draft: AnswerDraft) => void;
}

export interface AnswerDraft {
  text: string;
  suggestions: readonly PlayerSuggestion[];
}

/**
 * The answer box. Suggestions come from every player in the database, whatever the
 * question, so the list never hints at who is right.
 */
export function AnswerInput({ disabled, onPick, onDraftChange }: Props) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  /** A suggestion picked out with the arrow keys; null means the best fit. */
  const [chosenId, setChosenId] = useState<number | null>(null);
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

  const shown = useMemo(() => (canSearch ? suggestions : []), [canSearch, suggestions]);

  useEffect(() => {
    onDraftChange({ text, suggestions: shown });
  }, [text, shown, onDraftChange]);

  // The highlighted suggestion is the one Enter picks: the best fit, unless the arrows moved it.
  const active = shown.find((player) => player.id === chosenId) ?? bestMatch(text, shown);

  function move(step: number) {
    if (shown.length === 0) return;
    const index = active ? shown.indexOf(active) : -1;
    const next = shown[(index + step + shown.length) % shown.length];
    if (next) setChosenId(next.id);
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (active && !disabled) onPick(active);
      }}
    >
      <label htmlFor="answer" className="sr-only">
        Type a player&apos;s name, then choose from the list
      </label>
      <input
        id="answer"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setChosenId(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            move(event.key === "ArrowDown" ? 1 : -1);
          }
        }}
        disabled={disabled}
        maxLength={PLAYER_SEARCH.maxQueryLength}
        placeholder="Type a player's name"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="done"
        role="combobox"
        aria-expanded={shown.length > 0}
        aria-controls="answer-suggestions"
        aria-activedescendant={active ? `suggestion-${active.id}` : undefined}
        autoFocus
        className="pixel-input p-3 text-2xl placeholder:text-chalk-dim/60"
      />
      <ul id="answer-suggestions" role="listbox" className="flex flex-col gap-1.5">
        {shown.map((player, index) => {
          const isActive = player === active;
          return (
            <li
              key={player.id}
              id={`suggestion-${player.id}`}
              role="option"
              aria-selected={isActive}
              className={`animate-reveal-in ${suggestionVisibility(index)}`}
              style={{ animationDelay: `${index * 25}ms` }}
            >
              <button
                type="button"
                tabIndex={-1}
                disabled={disabled}
                onClick={() => onPick(player)}
                className={`flex w-full items-baseline gap-2 border-4 px-3 py-1.5 text-left transition-colors duration-100 ${
                  isActive
                    ? "border-floodlight bg-stand"
                    : "border-stand bg-night-deep hover:border-chalk-dim"
                }`}
              >
                <span className="min-w-0 truncate text-xl">{player.name}</span>
                <span className="min-w-0 flex-1 truncate text-lg text-chalk-dim">
                  {describe(player)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </form>
  );
}

/**
 * How many suggestions fit: four on most phones and laptops, six on tall screens, three
 * when a phone's keyboard has squeezed the page, so the list never runs off the bottom.
 */
function suggestionVisibility(index: number): string {
  if (index >= 6) return "hidden";
  if (index >= 4) return "[@media(max-height:800px)]:hidden";
  if (index >= 3) return "[@media(max-height:560px)]:hidden";
  return "";
}

/** Enough to tell apart two players who share a name. */
function describe(player: PlayerSuggestion): string {
  const details = [player.country, player.birthYear ? `born ${player.birthYear}` : null].filter(
    Boolean,
  );
  return details.join(", ");
}
