"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { GameScreen, type Difficulty } from "@/features/game";
import { LifetimeCard, useAccess } from "@/features/payments";
import {
  DEFAULT_SETTINGS,
  readSettings,
  saveSettings,
  type UnlimitedSettings,
} from "../unlimited-settings";

const LEVELS: readonly { key: Difficulty; name: string; explanation: string }[] = [
  {
    key: "easy",
    name: "EASY",
    explanation: "Big clubs and famous names. Most fans can name a few straight away.",
  },
  {
    key: "medium",
    name: "MEDIUM",
    explanation: "The full mix. Some you'll fly through, some will make you think.",
  },
  {
    key: "hard",
    name: "HARD",
    explanation: "Still fair clubs, but the answers that come to mind are rarer.",
  },
];

/** Endless rounds of 7 from the question bank, for lifetime players. */
export function UnlimitedScreen() {
  const access = useAccess();
  const [settings, setSettings] = useState<UnlimitedSettings>(DEFAULT_SETTINGS);
  /** Bumped for each new round, so the game screen starts afresh. */
  const [round, setRound] = useState<number | null>(null);

  useEffect(() => {
    // Saved choices load after the first paint, so server and browser agree on it.
    const saved = readSettings();
    const apply = setTimeout(() => setSettings(saved), 0);
    return () => clearTimeout(apply);
  }, []);

  function update(next: Partial<UnlimitedSettings>) {
    const merged = { ...settings, ...next };
    setSettings(merged);
    saveSettings(merged);
  }

  if (round !== null) {
    return (
      <GameScreen
        key={round}
        round={{ mode: "unlimited", difficulty: settings.difficulty }}
        practice={{ timed: settings.timed, onQuit: () => setRound(null) }}
        onPlayAgain={() => setRound(round + 1)}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="page-title">UNLIMITED</h1>
      <p className="page-lead">
        Round after round of 7, from the whole question bank. Questions you have not seen come
        first. Just for fun: no Top Kitties, no coins.
      </p>
      {access === null ? <Loader /> : null}
      {access?.lifetime ? (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-pixel text-[10px] text-chalk-dim">DIFFICULTY</legend>
            {LEVELS.map((level) => {
              const picked = settings.difficulty === level.key;
              return (
                <label
                  key={level.key}
                  className={`pixel-panel flex cursor-pointer items-start gap-3 p-3 transition-colors ${
                    picked ? "border-floodlight" : "hover:border-chalk"
                  }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={level.key}
                    checked={picked}
                    onChange={() => update({ difficulty: level.key })}
                    className="mt-1 h-4 w-4 accent-[var(--color-floodlight)]"
                  />
                  <span className="flex flex-col gap-1">
                    <span
                      className={`font-pixel text-xs ${picked ? "text-floodlight" : "text-chalk"}`}
                    >
                      {level.name}
                    </span>
                    <span className="text-lg leading-tight text-chalk-dim">
                      {level.explanation}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <label className="pixel-panel flex cursor-pointer items-center justify-between gap-3 p-3">
            <span className="flex flex-col gap-1">
              <span className="font-pixel text-xs">TIMER</span>
              <span className="text-lg leading-tight text-chalk-dim">
                {settings.timed
                  ? "45 seconds a question. You can pause any time."
                  : "No clock. Take as long as you like."}
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={settings.timed}
              onChange={(event) => update({ timed: event.target.checked })}
              className="h-6 w-6 shrink-0 accent-[var(--color-floodlight)]"
            />
          </label>

          <button
            type="button"
            onClick={() => setRound(0)}
            className="pixel-button animate-kickoff border-floodlight px-6 py-5 text-xl text-floodlight"
          >
            KICK OFF
          </button>
        </>
      ) : null}
      {access && !access.lifetime ? <LifetimeCard /> : null}
    </section>
  );
}
