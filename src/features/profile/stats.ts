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
  /** Nine Lives only: whether this month's one missed day has been used. */
  lifeUsedThisMonth: boolean;
}

export interface StreakRules {
  /** Lifetime unlock: one missed day per UK calendar month does not break a streak. */
  nineLives: boolean;
}

const monthOf = (day: string) => day.slice(0, 7);

/**
 * Lengths of each run of consecutive days, from sorted, distinct days. With Nine Lives a
 * single missed day is bridged, once per calendar month; `livesUsed` collects those months.
 * A run's length counts the days played.
 */
function runs(
  days: readonly string[],
  rules: StreakRules,
  livesUsed: Set<string>,
): { end: string; length: number }[] {
  const found: { end: string; length: number }[] = [];
  for (const day of days) {
    const last = found.at(-1);
    const missed = last ? addDays(last.end, 1) : null;
    const bridged =
      last &&
      missed &&
      rules.nineLives &&
      addDays(missed, 1) === day &&
      !livesUsed.has(monthOf(missed));
    if (last && (missed === day || bridged)) {
      if (bridged && missed) livesUsed.add(monthOf(missed));
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
export function computeStats(
  history: readonly PlayedDay[],
  today: string,
  rules: StreakRules = { nineLives: false },
): PlayerStats {
  const days = [...new Set(history.map((day) => day.date))].filter((day) => day <= today).sort();
  const livesUsed = new Set<string>();
  const allRuns = runs(days, rules, livesUsed);
  const lastRun = allRuns.at(-1);
  const yesterday = addDays(today, -1);
  // With a life left for yesterday's month, a streak ending the day before survives too.
  const savedByLife =
    rules.nineLives && lastRun?.end === addDays(today, -2) && !livesUsed.has(monthOf(yesterday));
  if (savedByLife) livesUsed.add(monthOf(yesterday));
  const alive = lastRun && (lastRun.end === today || lastRun.end === yesterday || savedByLife);

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
    lifeUsedThisMonth: rules.nineLives && livesUsed.has(monthOf(today)),
  };
}
