import { compose, type Grid, type Layer } from "../pixel/grid";
import { BODY_ROWS, CAT_HEIGHT, CAT_WIDTH, EARS, SHIRT_MIDDLE } from "./base";
import { accessoryLayers, maneLayer, markingLayers } from "./extras";
import type { CatLook, KitColours } from "./look";

/** Room round the cat for manes, bags and mirrors that reach past its edges. */
export const MARGIN = 3;
export const CANVAS_WIDTH = CAT_WIDTH + MARGIN * 2;
export const CANVAS_HEIGHT = CAT_HEIGHT + MARGIN;

const OUTLINE = "#1a1a1a";
const NOSE = "#f29ab0";
const EYE_SHINE = "#ffffff";

/** Which kit colour a shirt pixel takes, from the pattern and where the pixel is. */
export function shirtColour(kit: KitColours, x: number, y: number): string {
  const second = (() => {
    switch (kit.pattern) {
      case "plain":
        return false;
      case "stripes":
        return x % 2 === 1;
      case "hoops":
        return y % 2 === 1;
      case "halves":
        return x >= SHIRT_MIDDLE;
      case "sash":
        return x - y === -8 || x - y === -9;
    }
  })();
  return second ? kit.secondary : kit.primary;
}

/** The cat's body with every shirt pixel turned into its own one-character layer. */
function bodyLayers(look: CatLook): Layer[] {
  const rows = [...EARS[look.ears], ...BODY_ROWS];
  const palette = {
    O: OUTLINE,
    F: look.fur,
    f: look.furShade,
    W: look.muzzle,
    E: look.eyes,
    e: EYE_SHINE,
    N: NOSE,
    S: look.kit.shorts,
    B: look.boots,
  };

  const shirt: Layer[] = [];
  const withoutShirt = rows.map((row, y) =>
    [...row]
      .map((char, x) => {
        if (char !== "K") return char;
        shirt.push({ x, y, rows: ["K"], palette: { K: shirtColour(look.kit, x, y) } });
        return ".";
      })
      .join(""),
  );
  return [{ x: 0, y: 0, rows: withoutShirt, palette }, ...shirt];
}

function shift(layer: Layer): Layer {
  return { ...layer, x: layer.x + MARGIN, y: layer.y + MARGIN };
}

/** The finished pixel grid for a cat footballer, ready to draw. */
export function buildCat(look: CatLook): Grid {
  const layers: Layer[] = [
    ...(look.mane ? [maneLayer(look.mane)] : []),
    ...bodyLayers(look),
    ...markingLayers(look.markings, look),
    ...look.accessories.flatMap((accessory) => accessoryLayers(accessory, look)),
  ];
  return compose(CANVAS_WIDTH, CANVAS_HEIGHT, layers.map(shift));
}
