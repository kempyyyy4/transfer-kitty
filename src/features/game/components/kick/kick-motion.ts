/**
 * The maths of the kick after each answer. The further the ball has to go (the rarer the
 * tier), the harder Kit kicks it: a longer flight and a higher arc. Kept apart from the
 * drawing so the feel can be tuned, and tested, in one place.
 */

/** Pixels between one tier kitty and the next along the pitch. */
export const SPACING = 150;
/** Kit's run-up before the strike. */
export const RUN_UP_MS = 420;
/** How long the boot squashes the ball at the moment of the strike. */
export const STRIKE_MS = 90;

/** How hard the kick is, from 0 (a tap to the Stray beside Kit) to 1 (to the Galacticat). */
export function powerFor(tier: number): number {
  return Math.min(1, Math.max(0, (tier + 1) / 8));
}

/** The ball's flight time: a quick pass for a short one, a long hang for a big one. */
export function flightMs(tier: number): number {
  return 900 + 2400 * powerFor(tier);
}

/** How far the ball travels: to just in front of the receiving kitty's feet. */
export function distanceFor(tier: number): number {
  return (tier + 1) * SPACING - 26;
}

/** Fast off the boot, slowing as it arrives. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * The ball's height above the grass, in pixels, at progress `t` (0 to 1) of the flight:
 * one arc whose peak grows with power, then two small bounces before it reaches the kitty.
 */
export function heightAt(t: number, power: number): number {
  const peak = 18 + 120 * power;
  if (t < 0.72) {
    const v = t / 0.72;
    return 4 * peak * v * (1 - v);
  }
  if (t < 0.9) {
    const v = (t - 0.72) / 0.18;
    return 4 * peak * 0.16 * v * (1 - v);
  }
  const v = (t - 0.9) / 0.1;
  return 4 * peak * 0.04 * v * (1 - v);
}

/** How the receiving kitty takes the ball: the poorer the tier, the worse the touch. */
export type Touch = "miss" | "heavy" | "chest" | "trap" | "showboat";

export function touchFor(tier: number): Touch {
  if (tier <= 0) return "miss";
  if (tier <= 2) return "heavy";
  if (tier <= 4) return "chest";
  if (tier <= 6) return "trap";
  return "showboat";
}

/** Bounces of keepy-ups: up, down, up, down... */
function keepyUps(count: number, height: number, from = 0): Keyframe[] {
  const frames: Keyframe[] = [{ transform: `translate(${from}px, 0)` }];
  for (let i = 0; i < count; i++) {
    frames.push(
      { transform: `translate(${from}px, ${-height}px)`, easing: "ease-in" },
      { transform: `translate(${from}px, 0)`, easing: "ease-out" },
    );
  }
  return frames;
}

/** The ball's movement for each touch, played after it arrives. */
export const TOUCH_MOTIONS: Record<Touch, { frames: Keyframe[]; durationMs: number }> = {
  /** Straight under the boot and away off the pitch. */
  miss: {
    durationMs: 1100,
    frames: [
      { transform: "translate(0, 0)" },
      { transform: "translate(60px, 0)", easing: "ease-out" },
      { transform: "translate(170px, 0)", opacity: 0 },
    ],
  },
  /** Off the knee, a big bounce, then a scramble to get it back. */
  heavy: {
    durationMs: 1300,
    frames: [
      { transform: "translate(0, 0)" },
      { transform: "translate(22px, -54px)", easing: "ease-in", offset: 0.3 },
      { transform: "translate(34px, 0)", easing: "ease-out", offset: 0.55 },
      { transform: "translate(26px, -14px)", easing: "ease-in", offset: 0.75 },
      { transform: "translate(10px, 0)" },
    ],
  },
  /** Up onto the chest, cushioned, and down to the feet. */
  chest: {
    durationMs: 1000,
    frames: [
      { transform: "translate(0, 0)" },
      { transform: "translate(10px, -46px)", easing: "ease-out", offset: 0.45 },
      { transform: "translate(12px, -40px)", offset: 0.6 },
      { transform: "translate(14px, 0)", easing: "ease-in" },
    ],
  },
  /** Killed dead under the sole, then three keepy-ups. */
  trap: { durationMs: 1700, frames: keepyUps(3, 42, 12) },
  /** Six keepy-ups, the last flicked high, and caught on the back of the neck. */
  showboat: {
    durationMs: 3000,
    frames: [
      ...keepyUps(5, 40, 12),
      { transform: "translate(12px, -150px) rotate(360deg)", easing: "ease-out", offset: 0.82 },
      { transform: "translate(14px, -46px) rotate(720deg)", easing: "ease-in" },
    ],
  },
};

/** How the receiving kitty moves with its touch. */
export const RECEIVER_MOTIONS: Record<Touch, Keyframe[]> = {
  miss: [
    { transform: "rotate(0)" },
    { transform: "rotate(-14deg) translateX(-6px)", offset: 0.3 },
    { transform: "rotate(0)" },
  ],
  heavy: [
    { transform: "translateX(0)" },
    { transform: "translateX(10px) rotate(6deg)", offset: 0.4 },
    { transform: "translateX(0)" },
  ],
  chest: [
    { transform: "scaleY(1)" },
    { transform: "scaleY(0.9) translateY(4px)", offset: 0.45 },
    { transform: "scaleY(1)" },
  ],
  trap: [
    { transform: "translateY(0)" },
    { transform: "translateY(-6px)", offset: 0.5 },
    { transform: "translateY(0)" },
  ],
  showboat: [
    { transform: "translateY(0)" },
    { transform: "translateY(-10px)", offset: 0.25 },
    { transform: "translateY(0)", offset: 0.5 },
    { transform: "translateY(-16px) rotate(-8deg)", offset: 0.85 },
    { transform: "translateY(0)" },
  ],
};
