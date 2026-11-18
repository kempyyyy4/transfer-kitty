import type { Layer } from "../pixel/grid";
import type { Hair, HairStyle } from "./look";

/**
 * Hairstyles, drawn over the top of the head in the cat's own coordinates (the head's top
 * edge is row 3). H hair, h hair shade, O outline, B band. Football fashions, not any one
 * person's look.
 */
const STYLES: Record<HairStyle, { x: number; y: number; rows: readonly string[] }> = {
  crop: {
    x: 4,
    y: 1,
    rows: [".h.hh.h.", "hHHHHHHh", "OHHHHHHO"],
  },
  bun: {
    x: 4,
    y: -2,
    rows: ["...OO...", "..OHHO..", "..OBBO..", ".OHHHHO.", "OHHHHHHO", "OHHhhHHO"],
  },
  mohawk: {
    x: 7,
    y: -2,
    rows: ["OO", "HH", "Hh", "HH", "hH", "HH"],
  },
  afro: {
    x: 2,
    y: -2,
    rows: [
      "...OOOOOO...",
      "..OHhHHhHO..",
      ".OHHHhHHHHO.",
      "OHhHHHHhHHHO",
      "OHHHHhHHHhHO",
      "OHHhHHHHHHhO",
    ],
  },
  long: {
    x: 1,
    y: 1,
    rows: [
      "...OOOOOOOO...",
      "..OBBBBBBBBO..",
      ".OHHHHHHHHHHO.",
      "OH..........HO",
      "OH..........HO",
      "OH..........HO",
      "Oh..........hO",
      "OH..........HO",
      ".O..........O.",
    ],
  },
  /** Shaved, with one small tuft left at the front. */
  tuft: {
    x: 6,
    y: 2,
    rows: [".HH.", "OHhO"],
  },
  braids: {
    x: 1,
    y: 1,
    rows: [
      "...OOOOOOOO...",
      "..OHhHhHhHHO..",
      ".OHHHHHHHHHHO.",
      "Oh..........hO",
      "OH..........HO",
      "Oh..........hO",
      "OH..........HO",
      "Oh..........hO",
      ".O..........O.",
    ],
  },
};

export function hairLayer(hair: Hair): Layer {
  const style = STYLES[hair.style];
  return {
    ...style,
    palette: { H: hair.colour, h: hair.shade, O: "#141414", B: hair.band ?? hair.shade },
  };
}
