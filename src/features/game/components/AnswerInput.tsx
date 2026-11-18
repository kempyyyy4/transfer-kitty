"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PLAYER_SEARCH } from "@/config/rate-limits";
import { gameApi } from "../api-client";
import { bestMatch } from "../best-match";
import type { PlayerSuggestion } from "../types";

/** Wait this long after the last keystroke before searching, to spare the server. */
const SEARCH_DELAY_MS = 200;

/** The latest wrong guess. `id` changes with every guess, so the same name can shake twice. */
export interface WrongGuess {
  id: number;
  player: PlayerSuggestion;
  guessesLeft: number;
}

interface Props {
  /** True while a guess is with the server. */
  checking: boolean;
  wrongGuess: WrongGuess | null;
  /** Everyone guessed wrongly so far on this question, oldest first. */
  wrongSoFar: readonly PlayerSuggestion[];
  onSubmit: (player: PlayerSuggestion) => void;
  /** Reports what is typed, suggested and chosen, so it can still be sent if time runs out. */
  onDraftChange: (draft: AnswerDraft) => void;
}

export interface AnswerDraft {
  text: string;
  suggestions: readonly PlayerSuggestion[];
  /** The player chosen from the list but not yet submitted. */
  chosen: PlayerSuggestion | null;
}

/**
 * The answer box, as in Krillion: type, choose a name from the list (tap, or arrows and
 * Enter), then press Enter or SUBMIT. A wrong guess shakes the box red and says so, and the
 * player keeps going. Suggestions come from every player in the database, whatever the
 * question, so the list never hints at who is right.
 */
export function AnswerInput({ checking, wrongGuess, wrongSoFar, onSubmit, onDraftChange }: Props) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  /** A suggestion picked out with the arrow keys; null means the best fit. */
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [chosen, setChosen] = useState<PlayerSuggestion | null>(null);
  const [shownGuessId, setShownGuessId] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const query = text.trim();
  const canSearch = !chosen && query.length >= PLAYER_SEARCH.minQueryLength;

  // A new wrong guess clears the box for the next try. Set during render, not in an effect,
  // so the shake and the cleared box arrive in the same frame.
  if (wrongGuess && wrongGuess.id !== shownGuessId) {
    setShownGuessId(wrongGuess.id);
    setText("");
    setChosen(null);
    setHighlightId(null);
  }

  useEffect(() => {
    if (wrongGuess) input.current?.focus();
  }, [wrongGuess]);

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
  const wrongIds = useMemo(() => new Set(wrongSoFar.map((player) => player.id)), [wrongSoFar]);

  useEffect(() => {
    onDraftChange({ text, suggestions: shown, chosen });
  }, [text, shown, chosen, onDraftChange]);

  // The highlighted suggestion is the one Enter chooses: the best fit, unless the arrows moved it.
  const highlighted = shown.find((player) => player.id === highlightId) ?? bestMatch(text, shown);

  function move(step: number) {
    if (shown.length === 0) return;
    const index = highlighted ? shown.indexOf(highlighted) : -1;
    const next = shown[(index + step + shown.length) % shown.length];
    if (next) setHighlightId(next.id);
  }

  /** Enter chooses the highlighted name, and once a name is chosen, submits it. */
  function enter() {
    if (checking) return;
    if (chosen) onSubmit(chosen);
    else if (highlighted) choose(highlighted);
  }

  function choose(player: PlayerSuggestion) {
    setChosen(player);
    setText(player.name);
    setHighlightId(null);
    input.current?.focus();
  }

  const shaking = wrongGuess !== null && wrongGuess.id === shownGuessId && !chosen && text === "";

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        enter();
      }}
    >
      <label htmlFor="answer" className="sr-only">
        Type a player&apos;s name, choose them from the list, then submit
      </label>
      <div className="flex gap-2">
        <input
          ref={input}
          key={wrongGuess?.id ?? "first"}
          id="answer"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setChosen(null);
            setHighlightId(null);
          }}
          onKeyDown={(event) => {
            // Handled here, not by the form: a form whose submit button is disabled
            // ignores Enter, and SUBMIT stays disabled until a name is chosen.
            if (event.key === "Enter") {
              event.preventDefault();
              enter();
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              move(event.key === "ArrowDown" ? 1 : -1);
            }
          }}
          maxLength={PLAYER_SEARCH.maxQueryLength}
          placeholder="Type a player's name"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint={chosen ? "send" : "done"}
          role="combobox"
          aria-expanded={shown.length > 0}
          aria-controls="answer-suggestions"
          aria-activedescendant={highlighted ? `suggestion-${highlighted.id}` : undefined}
          aria-invalid={shaking}
          autoFocus
          className={`pixel-input min-w-0 flex-1 p-3 text-2xl transition-colors placeholder:text-chalk-dim/60 ${
            shaking
              ? "animate-shake border-claret focus:border-claret"
              : chosen
                ? "border-turf-light focus:border-turf-light"
                : ""
          }`}
        />
        <button
          type="submit"
          disabled={!chosen || checking}
          className={`pixel-button shrink-0 px-3 text-[10px] ${
            chosen ? "border-floodlight bg-floodlight text-night-deep hover:text-night-deep" : ""
          }`}
        >
          {checking ? "..." : "SUBMIT"}
        </button>
      </div>

      <p role="status" aria-live="polite" className="min-h-6 text-lg leading-tight">
        {shaking && wrongGuess ? (
          <span className="text-claret">
            {wrongGuess.player.name} isn&apos;t a valid answer. Keep going!
          </span>
        ) : chosen ? (
          <span className="text-chalk-dim">Press Enter or SUBMIT to lock it in.</span>
        ) : null}
      </p>

      {wrongSoFar.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Wrong guesses">
          {wrongSoFar.map((player) => (
            <li
              key={player.id}
              className="border-2 border-claret/60 px-2 text-lg text-chalk-dim line-through"
            >
              {player.name}
            </li>
          ))}
        </ul>
      ) : null}

      <ul id="answer-suggestions" role="listbox" className="flex flex-col gap-1.5">
        {shown.map((player, index) => {
          const isHighlighted = player === highlighted;
          const triedAlready = wrongIds.has(player.id);
          return (
            <li
              key={player.id}
              id={`suggestion-${player.id}`}
              role="option"
              aria-selected={isHighlighted}
              className={`animate-reveal-in ${suggestionVisibility(index)}`}
              style={{ animationDelay: `${index * 25}ms` }}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => choose(player)}
                className={`flex w-full items-baseline gap-2 border-4 px-3 py-1.5 text-left transition-colors duration-100 ${
                  isHighlighted
                    ? "border-floodlight bg-stand"
                    : "border-stand bg-night-deep hover:border-chalk-dim"
                } ${triedAlready ? "opacity-50" : ""}`}
              >
                <span className={`min-w-0 truncate text-xl ${triedAlready ? "line-through" : ""}`}>
                  {player.name}
                </span>
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
