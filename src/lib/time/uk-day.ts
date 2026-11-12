/**
 * The puzzle changes at midnight UK time, summer and winter. Everything about "which day
 * is it" goes through here so the app never depends on the server's own time zone.
 * Days are passed around as "YYYY-MM-DD" strings, which sort and compare correctly.
 */
const UK_TIME_ZONE = "Europe/London";
const MS_PER_DAY = 86_400_000;

const ukDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: UK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The UK calendar day at a given moment. */
export function ukDayOf(moment: Date): string {
  // The en-CA locale writes dates as YYYY-MM-DD.
  return ukDateFormat.format(moment);
}

/** Moves a day forwards or backwards by whole calendar days. */
export function addDays(day: string, count: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + count * MS_PER_DAY).toISOString().slice(0, 10);
}

/** How many calendar days `later` is after `earlier`. Negative if it is before. */
export function daysBetween(earlier: string, later: string): number {
  return Math.round(
    (Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / MS_PER_DAY,
  );
}

/** The Monday-to-Sunday week a day falls in, as the first and last day. */
export function weekContaining(day: string): { from: string; to: string } {
  // getUTCDay counts Sunday as 0; shifting by 6 makes Monday the start of the week.
  const daysSinceMonday = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
  const from = addDays(day, -daysSinceMonday);
  return { from, to: addDays(from, 6) };
}

/**
 * The moment the next UK day begins.
 * Midnight in the UK is 00:00 or 23:00 in UTC depending on the clocks, so both candidates
 * around the next date are tried and the first one that lands on the new UK day is used.
 */
export function nextUkMidnight(moment: Date): Date {
  const tomorrow = addDays(ukDayOf(moment), 1);
  const utcMidnight = Date.parse(`${tomorrow}T00:00:00Z`);
  const oneHourEarlier = new Date(utcMidnight - 3_600_000);

  return ukDayOf(oneHourEarlier) === tomorrow ? oneHourEarlier : new Date(utcMidnight);
}
