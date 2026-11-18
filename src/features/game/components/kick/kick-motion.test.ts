import { describe, expect, it } from "vitest";
import {
  BOUNCES,
  cameraScaleAt,
  distanceFor,
  flightMs,
  heightAt,
  hitStopMs,
  powerFor,
  touchFor,
  SPACING,
} from "./kick-motion";

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

describe("the kick's weight", () => {
  it("holds the strike longer and pulls the camera back further on a harder kick", () => {
    expect(hitStopMs(powerFor(7))).toBeGreaterThan(hitStopMs(powerFor(1)));
    expect(cameraScaleAt(0.36, powerFor(7))).toBeLessThan(cameraScaleAt(0.36, powerFor(1)));
  });

  it("has the camera back in by the first bounce", () => {
    expect(cameraScaleAt(0, 1)).toBe(1);
    expect(cameraScaleAt(BOUNCES[0].at, 1)).toBeCloseTo(1);
    expect(cameraScaleAt(1, 1)).toBeCloseTo(1);
  });
});
