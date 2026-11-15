import { gameApi } from "./api-client";
import type { StartedGame } from "./types";

/**
 * Today's round, started the moment KICK OFF is pressed rather than after the play page
 * has loaded, so the first question is usually ready by the time the page is.
 * `askedAt` is when it was asked for: the on-screen timer must count from then, because
 * the server's clock may have started any time after it.
 */
export interface DailyStart {
  started: Promise<StartedGame>;
  askedAt: number;
}

let early: DailyStart | null = null;

export function startDailyEarly(): void {
  early ??= { started: gameApi.start(), askedAt: performance.now() };
}

/** The early start if there is one (used once), otherwise a fresh start. */
export function takeDailyStart(): DailyStart {
  const start = early ?? { started: gameApi.start(), askedAt: performance.now() };
  early = null;
  return start;
}
