import { describe, expect, it } from "vitest";
import { addDays, daysBetween, nextUkMidnight, ukDayOf } from "./uk-day";

const at = (iso: string) => new Date(iso);

describe("ukDayOf", () => {
  it("matches the UTC day in winter, when the UK is on GMT", () => {
    expect(ukDayOf(at("2026-12-15T23:30:00Z"))).toBe("2026-12-15");
    expect(ukDayOf(at("2026-12-16T00:00:00Z"))).toBe("2026-12-16");
  });

  it("rolls over an hour before UTC in summer, when the UK is on BST", () => {
    expect(ukDayOf(at("2026-06-15T22:59:59Z"))).toBe("2026-06-15");
    expect(ukDayOf(at("2026-06-15T23:00:00Z"))).toBe("2026-06-16");
  });

  it("handles the night the clocks go forward", () => {
    // 29 March 2026: 01:00 GMT becomes 02:00 BST.
    expect(ukDayOf(at("2026-03-28T23:59:59Z"))).toBe("2026-03-28");
    expect(ukDayOf(at("2026-03-29T00:00:00Z"))).toBe("2026-03-29");
    expect(ukDayOf(at("2026-03-29T22:59:59Z"))).toBe("2026-03-29");
    expect(ukDayOf(at("2026-03-29T23:00:00Z"))).toBe("2026-03-30");
  });

  it("handles the night the clocks go back", () => {
    // 25 October 2026: 02:00 BST becomes 01:00 GMT.
    expect(ukDayOf(at("2026-10-24T22:59:59Z"))).toBe("2026-10-24");
    expect(ukDayOf(at("2026-10-24T23:00:00Z"))).toBe("2026-10-25");
    expect(ukDayOf(at("2026-10-25T23:30:00Z"))).toBe("2026-10-25");
    expect(ukDayOf(at("2026-10-26T00:00:00Z"))).toBe("2026-10-26");
  });
});

describe("nextUkMidnight", () => {
  it("is midnight UTC in winter", () => {
    expect(nextUkMidnight(at("2026-12-15T12:00:00Z")).toISOString()).toBe(
      "2026-12-16T00:00:00.000Z",
    );
  });

  it("is 23:00 UTC in summer", () => {
    expect(nextUkMidnight(at("2026-06-15T12:00:00Z")).toISOString()).toBe(
      "2026-06-15T23:00:00.000Z",
    );
  });

  it("is a 23-hour day when the clocks go forward", () => {
    const start = at("2026-03-29T00:00:00Z");

    expect(nextUkMidnight(start).toISOString()).toBe("2026-03-29T23:00:00.000Z");
  });

  it("is a 25-hour day when the clocks go back", () => {
    const start = at("2026-10-24T23:00:00Z");

    expect(nextUkMidnight(start).toISOString()).toBe("2026-10-26T00:00:00.000Z");
  });

  it("always lands exactly on the start of the next UK day", () => {
    for (const iso of ["2026-01-01T00:00:00Z", "2026-03-29T12:00:00Z", "2026-07-04T22:59:00Z"]) {
      const midnight = nextUkMidnight(at(iso));
      const justBefore = new Date(midnight.getTime() - 1);

      expect(ukDayOf(midnight)).not.toBe(ukDayOf(justBefore));
      expect(ukDayOf(justBefore)).toBe(ukDayOf(at(iso)));
    }
  });
});

describe("addDays and daysBetween", () => {
  it("moves across month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("counts whole days, including across a clock change", () => {
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(daysBetween("2026-11-12", "2026-11-12")).toBe(0);
    expect(daysBetween("2026-11-12", "2026-11-10")).toBe(-2);
  });
});
