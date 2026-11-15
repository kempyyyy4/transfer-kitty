/** How each tier's kitty takes the ball: the poorer the tier, the worse the touch. */
export type Control = "fumble" | "heavy" | "clean" | "juggle" | "showboat";

export function controlFor(level: number): Control {
  if (level <= 1) return "fumble";
  if (level <= 3) return "heavy";
  if (level <= 5) return "clean";
  if (level === 6) return "juggle";
  return "showboat";
}

/** Bounces of a ball doing keepy-ups: up, down, up, down... */
function keepyUps(count: number, height: number): Keyframe[] {
  const frames: Keyframe[] = [{ transform: "translateY(0)" }];
  for (let i = 0; i < count; i++) {
    frames.push({ transform: `translateY(${-height}px)` }, { transform: "translateY(0)" });
  }
  return frames;
}

/** The ball's movement for each kind of touch, played with the Web Animations API. */
export const CONTROL_MOTIONS: Record<Control, { keyframes: Keyframe[]; durationMs: number }> = {
  /** Off the shin and away. */
  fumble: {
    durationMs: 1300,
    keyframes: [
      { transform: "translate(0, 0) rotate(0)" },
      { transform: "translate(14px, -46px) rotate(160deg)", offset: 0.3 },
      { transform: "translate(70px, 0) rotate(420deg)", offset: 0.6 },
      { transform: "translate(150px, -12px) rotate(620deg)", offset: 0.8 },
      { transform: "translate(230px, 0) rotate(800deg)", opacity: 0 },
    ],
  },
  /** A heavy first touch that bounces up and needs a second go. */
  heavy: {
    durationMs: 1200,
    keyframes: [
      { transform: "translateY(0)" },
      { transform: "translateY(-52px)", offset: 0.3 },
      { transform: "translateY(0)", offset: 0.55 },
      { transform: "translateY(-18px)", offset: 0.75 },
      { transform: "translateY(0)" },
    ],
  },
  /** Cushioned dead. */
  clean: {
    durationMs: 900,
    keyframes: [
      { transform: "translateY(-30px)" },
      { transform: "translateY(0)", offset: 0.6 },
      { transform: "translateY(-4px)", offset: 0.8 },
      { transform: "translateY(0)" },
    ],
  },
  /** Three keepy-ups. */
  juggle: { durationMs: 1800, keyframes: keepyUps(3, 44) },
  /** Six keepy-ups and a flick high into the air. */
  showboat: {
    durationMs: 3000,
    keyframes: [
      ...keepyUps(5, 40),
      { transform: "translateY(-150px) rotate(360deg)", offset: 0.85 },
      { transform: "translateY(0) rotate(720deg)" },
    ],
  },
};
