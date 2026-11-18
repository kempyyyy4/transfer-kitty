/** Number formats for the analytics dashboard. */

export const formatCount = (value: number) => Math.round(value).toLocaleString("en-GB");

export function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "-";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export const formatPence = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function formatPercent(part: number, whole: number): string {
  return whole > 0 ? `${((100 * part) / whole).toFixed(1)}%` : "-";
}

/** "2026-11-18" as "18 Nov". */
export function shortDay(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** A two-letter country code as its English name, or the code if unknown. */
export function countryName(code: string): string {
  if (!code) return "Unknown";
  try {
    return new Intl.DisplayNames(["en-GB"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Rows as a CSV file's text, quoting every cell. */
export function toCsv(rows: readonly Record<string, string | number>[]): string {
  const first = rows[0];
  if (!first) return "";
  const columns = Object.keys(first);
  const quote = (cell: string | number) => `"${String(cell).replaceAll('"', '""')}"`;
  return [
    columns.map(quote).join(","),
    ...rows.map((row) => columns.map((c) => quote(row[c] ?? "")).join(",")),
  ].join("\n");
}
