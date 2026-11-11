import { describe, expect, it } from "vitest";
import { INVOLVEMENT_FLOOR } from "@/config/fame";
import { startingPopularity } from "./popularity";

describe("startingPopularity", () => {
  it("equals fame for a fully involved player", () => {
    expect(startingPopularity(400, 1)).toBe(400);
  });

  it("drops to the floor share of fame for a player who barely featured", () => {
    expect(startingPopularity(400, 0)).toBeCloseTo(400 * INVOLVEMENT_FLOOR);
  });

  it("ranks a regular above an equally famous player who barely featured", () => {
    expect(startingPopularity(300, 0.9)).toBeGreaterThan(startingPopularity(300, 0.1));
  });

  it("treats involvement outside 0 to 1 as the nearest limit", () => {
    expect(startingPopularity(100, 5)).toBe(startingPopularity(100, 1));
    expect(startingPopularity(100, -2)).toBe(startingPopularity(100, 0));
  });
});
