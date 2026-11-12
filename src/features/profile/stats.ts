import { addDays } from "@/lib/time/uk-day";

export interface PlayedDay {
  /** UK day, "YYYY-MM-DD". */
  date: string;
  totalFee: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  /** Days in a row up to today, or up to yesterday if today is not played yet. */
  currentStreak: number;
  bestStreak: number;
  averageKitty: number;
  bestDay: PlayedDay | null;
}

/** Lengths of each run of consecutive days, from sorted, distinct days. */
function runs(days: readonly string[]): { end: string; length: number }[] {
  const found: { end: string; length: number }[] = [];
  for (const day of days) {
    const last = found.at(-1);
    if (last && addDays(last.end, 1) === day) {
      last.end = day;
      last.length++;
    } else {
      found.push({ end: day, length: 1 });
    }
  }
  return found;
}

/**
 * A player's record from their finished daily games. A streak survives until the end of
 * the day after the last game, so not having played yet today does not break it.
 */
export function computeStats(history: readonly PlayedDay[], today: string): PlayerStats {
  const days = [...new Set(history.map((day) => day.date))].filter((day) => day <= today).sort();
  const allRuns = runs(days);
  const lastRun = allRuns.at(-1);
  const alive = lastRun && (lastRun.end === today || lastRun.end === addDays(today, -1));

  const total = history.reduce((sum, day) => sum + day.totalFee, 0);
  const bestDay = history.reduce<PlayedDay | null>(
    (best, day) =>
      !best ||
      day.totalFee > best.totalFee ||
      (day.totalFee === best.totalFee && day.date < best.date)
        ? day
        : best,
    null,
  );

  return {
    gamesPlayed: history.length,
    currentStreak: alive ? lastRun.length : 0,
    bestStreak: Math.max(0, ...allRuns.map((run) => run.length)),
    averageKitty: history.length === 0 ? 0 : Math.round(total / history.length),
    bestDay,
  };
}
