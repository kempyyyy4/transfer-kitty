"use client";

import type { Difficulty } from "@/features/game";

/**
 * The player's Unlimited choices, remembered in this browser only, like the sound
 * setting: a personal preference the server never needs.
 */
export interface UnlimitedSettings {
  difficulty: Difficulty;
  timed: boolean;
}

const STORAGE_KEY = "transfer-kitty:unlimited";
export const DEFAULT_SETTINGS: UnlimitedSettings = { difficulty: "medium", timed: true };

export function readSettings(): UnlimitedSettings {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved === "object") {
      const { difficulty, timed } = saved as Partial<UnlimitedSettings>;
      return {
        difficulty:
          difficulty === "easy" || difficulty === "hard" ? difficulty : DEFAULT_SETTINGS.difficulty,
        timed: timed !== false,
      };
    }
  } catch {
    // Private browsing or blocked storage: the defaults apply.
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UnlimitedSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Not remembered, but still used for this visit.
  }
}
