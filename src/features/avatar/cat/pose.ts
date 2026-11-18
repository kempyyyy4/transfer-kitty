import { CAT_WIDTH } from "./base";
import type { CatLook, Pose } from "./look";
import type { Layer } from "../pixel/grid";

/**
 * Celebration poses: the arms moved from the cat's sides. Each pose lists cells for the
 * cat's left arm, in the cat's own coordinates; the right arm is the mirror image unless
 * the pose is one-armed. K sleeve, k second kit colour, F paw, O outline, _ rub out.
 */
type Cell = readonly [x: number, y: number, char: string];

/** Takes the resting arm away, leaving the side of the shirt neat. */
const LOWER_ARM_GONE: readonly Cell[] = [
  [2, 13, "_"],
  [2, 14, "_"],
  [3, 13, "O"],
  [3, 14, "O"],
];

const POSES: Record<Pose, { arm: readonly Cell[]; bothArms: boolean }> = {
  /** Both arms flung up and out to the crowd. */
  armsUp: {
    bothArms: true,
    arm: [
      ...LOWER_ARM_GONE,
      [2, 11, "K"],
      [1, 11, "K"],
      [1, 10, "K"],
      [0, 10, "K"],
      [0, 9, "K"],
      [-1, 9, "F"],
      [-1, 8, "F"],
      [-2, 8, "F"],
    ],
  },
  /** Both arms straight up, fingers to the sky. */
  pointUp: {
    bothArms: true,
    arm: [
      ...LOWER_ARM_GONE,
      [1, 11, "K"],
      [1, 12, "K"],
      [0, 10, "K"],
      [0, 9, "K"],
      [0, 8, "F"],
      [0, 7, "F"],
      [0, 6, "F"],
      [0, 5, "F"],
    ],
  },
  /** Arms out wide and down, landing a jump. */
  armsOut: {
    bothArms: true,
    arm: [
      ...LOWER_ARM_GONE,
      [2, 12, "K"],
      [1, 12, "K"],
      [1, 13, "K"],
      [0, 13, "K"],
      [-1, 14, "F"],
      [-2, 14, "F"],
    ],
  },
  /** Arms folded across the chest, unbothered. */
  folded: {
    bothArms: true,
    arm: [
      ...LOWER_ARM_GONE,
      [4, 12, "F"],
      [5, 12, "k"],
      [6, 12, "k"],
      [7, 12, "k"],
      [4, 13, "k"],
      [5, 13, "k"],
      [6, 13, "k"],
      [7, 13, "F"],
    ],
  },
  /** One fist punched at the sky. */
  fistUp: {
    bothArms: false,
    arm: [
      ...LOWER_ARM_GONE,
      [2, 11, "K"],
      [1, 10, "K"],
      [1, 9, "K"],
      [1, 8, "K"],
      [1, 7, "F"],
      [0, 7, "F"],
      [1, 6, "F"],
      [0, 6, "F"],
    ],
  },
};

const mirror = ([x, y, char]: Cell): Cell => [CAT_WIDTH - 1 - x, y, char];

/** The pose as one-cell layers, ready to paint over the cat. */
export function poseLayers(pose: Pose, look: CatLook): Layer[] {
  const { arm, bothArms } = POSES[pose];
  const cells = bothArms ? [...arm, ...arm.map(mirror)] : arm;
  const palette = {
    K: look.kit.primary,
    k: look.kit.secondary,
    F: look.fur,
    O: "#1a1a1a",
  };
  return cells.map(([x, y, char]) => ({ x, y, rows: [char], palette }));
}
