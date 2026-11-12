import type { Layer } from "../pixel/grid";
import type { Accessory, CatLook, Markings } from "./look";

/**
 * Markings and accessories, each a layer in the cat's own coordinates (0,0 is the top-left
 * of the 16 by 20 cat). Some reach outside the cat, so the canvas has room around it.
 */

const BLACK = "#141414";
const GOLD = "#f5c518";

export function markingLayers(markings: Markings, look: CatLook): Layer[] {
  if (markings === "tabby") {
    return [
      { x: 5, y: 4, rows: ["f.ff.f", ".f..f."], palette: { f: look.furShade } },
      { x: 1, y: 7, rows: ["f............f"], palette: { f: look.furShade } },
    ];
  }
  if (markings === "tuxedo") {
    const white = { W: look.muzzle };
    return [
      { x: 3, y: 13, rows: ["W........W", "W........W"], palette: white },
      { x: 5, y: 18, rows: ["WW...WW"], palette: { W: look.muzzle } },
    ];
  }
  return [];
}

const ACCESSORIES: Record<Accessory, Layer[]> = {
  sunglasses: [
    {
      x: 2,
      y: 6,
      rows: ["GgGGGGGGGgGG", "GGGG....GGGG"],
      palette: { G: BLACK, g: "#7fd3ff" },
    },
  ],
  headband: [{ x: 1, y: 4, rows: ["HHHHHHHHHHHHHH"], palette: { H: "#f2f2f2" } }],
  sweatbands: [{ x: 3, y: 14, rows: ["H........H"], palette: { H: "#f2f2f2" } }],
  captainsArmband: [{ x: 3, y: 13, rows: ["A"], palette: { A: GOLD } }],
  gloves: [{ x: 3, y: 13, rows: ["L........L", "L........L"], palette: { L: "#39d353" } }],
  quiff: [], // Needs the fur colour, so it is built in accessoryLayers.
  binBag: [
    {
      x: -3,
      y: 9,
      rows: ["..t..", ".bbb.", "bbbbb", "bbgbb", "bbbbb", "bbbbb", ".bbb."],
      palette: { b: "#1f1f24", g: "#4a4a55", t: GOLD },
    },
  ],
  mirror: [
    {
      x: 13,
      y: 9,
      rows: [".MM.", "MssM", "MSsM", ".MM.", ".h..", ".h.."],
      palette: { M: "#c9d1db", s: "#bfe8ff", S: "#ffffff", h: "#7a4a24" },
    },
  ],
  mud: [
    {
      x: 3,
      y: 12,
      rows: ["....m.....", "..........", ".mm.......", "......m...", "..m.....m."],
      palette: { m: "#6b4423" },
    },
  ],
};

export function accessoryLayers(accessory: Accessory, look: CatLook): Layer[] {
  if (accessory === "quiff") {
    return [
      {
        x: 5,
        y: 0,
        rows: ["...OO.", ".OFfFO", "OFFfFO"],
        palette: { O: "#1a1a1a", F: look.fur, f: look.furShade },
      },
    ];
  }
  return ACCESSORIES[accessory];
}

/**
 * A lion's mane: a shaggy oval round the head, drawn behind the cat so the face sits on
 * top of it. Built from a formula rather than drawn by hand, so it stays symmetrical.
 */
export function maneLayer(mane: { main: string; shade: string }): Layer {
  const rows: string[] = [];
  const top = -3;
  for (let y = top; y <= 11; y++) {
    let row = "";
    for (let x = -3; x <= 18; x++) {
      const dx = (x - 7.5) / 10.5;
      const dy = (y - 5) / 8;
      const distance = dx * dx + dy * dy;
      // A ragged edge: every other cell on the rim is left off.
      const onRim = distance > 0.82 && (x + y) % 2 === 0;
      if (distance > 1 || onRim) row += ".";
      else row += (x * 3 + y) % 4 === 0 ? "n" : "m";
    }
    rows.push(row);
  }
  return { x: -3, y: top, rows, palette: { m: mane.main, n: mane.shade } };
}
