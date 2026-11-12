"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether sound is on. Off by default, as the brief asks, and remembered in this browser
 * only: it is a personal preference, not something the server needs.
 */
const STORAGE_KEY = "transfer-kitty:sound";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    // Private browsing or blocked storage: sound simply stays off.
    return false;
  }
}

let soundOn: boolean | null = null;

export function isSoundOn(): boolean {
  if (typeof window === "undefined") return false;
  soundOn ??= read();
  return soundOn;
}

export function setSoundOn(on: boolean): void {
  soundOn = on;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Not remembered, but still applies until the page closes.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSoundOn(): boolean {
  return useSyncExternalStore(subscribe, isSoundOn, () => false);
}
