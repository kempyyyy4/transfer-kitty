import type { EarShape } from "./look";

/**
 * The cat footballer, 16 pixels wide and 20 tall: a big head on a small body.
 * O outline, F fur, f fur shade, W muzzle, E eye, e eye shine, N nose,
 * K shirt (coloured by the kit's pattern), S shorts, B boots.
 * Rows 0 to 2 are the ears and come from EARS.
 */
export const BODY_ROWS: readonly string[] = [
  ".OFFFOOOOOOFFFO.",
  "OFFFFFFFFFFFFFFO",
  "OFFFFFFFFFFFFFFO",
  "OFFeEFFFFFFeEFFO",
  "OFFEEFFFFFFEEFFO",
  "OFfFFWWNNWWFFfFO",
  ".OfFWWWWWWWWFfO.",
  "..OOffWWWWffOO..",
  "...OKKKKKKKKO...",
  "..OKKKKKKKKKKO..",
  "..OFKKKKKKKKFO..",
  "..OFKKKKKKKKFO..",
  "...OKKKKKKKKO...",
  "...OSSSSSSSSO...",
  "...OSSSOOSSSO...",
  "....OFFO.OFFO...",
  "...OBBBO.OBBBO..",
];

export const EARS: Record<EarShape, readonly string[]> = {
  pointy: ["..O..........O..", ".OFO........OFO.", ".OFFO......OFFO."],
  folded: ["................", "................", ".OOOO......OOOO."],
  torn: ["..O.............", ".OFO........OOO.", ".OFFO......OFFO."],
};

export const CAT_WIDTH = 16;
export const CAT_HEIGHT = 20;

/** The shirt's first and last columns, for patterns that split it down the middle. */
export const SHIRT_MIDDLE = 8;
