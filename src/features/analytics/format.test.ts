import { describe, expect, it } from "vitest";
import { formatDuration, formatPence, formatPercent, toCsv } from "./format";

describe("dashboard formats", () => {
  it("shows durations in the largest sensible units", () => {
    expect(formatDuration(4_400)).toBe("4s");
    expect(formatDuration(83_000)).toBe("1m 23s");
    expect(formatDuration(3_725_000)).toBe("1h 2m");
    expect(formatDuration(null)).toBe("-");
  });

  it("shows money and percentages", () => {
    expect(formatPence(399)).toBe("£3.99");
    expect(formatPercent(1, 3)).toBe("33.3%");
    expect(formatPercent(1, 0)).toBe("-");
  });

  it("writes CSV with every cell quoted", () => {
    expect(toCsv([{ day: "2026-11-18", note: 'say "hi"' }])).toBe(
      '"day","note"\n"2026-11-18","say ""hi"""',
    );
  });
});
