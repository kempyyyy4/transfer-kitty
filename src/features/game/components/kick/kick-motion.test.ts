import { describe, expect, it } from "vitest";
import { distanceFor, flightMs, heightAt, powerFor, touchFor, SPACING } from "./kick-motion";

describe("the kick", () => {
  it("kicks harder, further and for longer the rarer the tier", () => {
    for (let tier = 0; tier < 7; tier++) {
      expect(powerFor(tier + 1)).toBeGreaterThan(powerFor(tier));
      expect(flightMs(tier + 1)).toBeGreaterThan(flightMs(tier));
      expect(distanceFor(tier + 1) - distanceFor(tier)).toBe(SPACING);
    }
    expect(powerFor(7)).toBe(1);
  });

  it("lifts the ball higher on a harder kick", () => {
    expect(heightAt(0.36, powerFor(7))).toBeGreaterThan(heightAt(0.36, powerFor(1)));
  });

  it("starts and ends on the grass, after two smaller bounces", () => {
    const power = powerFor(5);
    expect(heightAt(0, power)).toBe(0);
    expect(heightAt(1, power)).toBeCloseTo(0);
    const peak = heightAt(0.36, power);
    expect(heightAt(0.81, power)).toBeLessThan(peak / 4);
    expect(heightAt(0.95, power)).toBeLessThan(heightAt(0.81, power));
  });

  it("gives poorer tiers worse touches", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(touchFor)).toEqual([
      "miss",
      "heavy",
      "heavy",
      "chest",
      "chest",
      "trap",
      "trap",
      "showboat",
    ]);
  });
});
