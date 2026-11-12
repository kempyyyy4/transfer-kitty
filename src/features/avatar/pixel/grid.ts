/**
 * A tiny pixel-art engine. Art is written as rows of characters, one character per pixel,
 * and each character is looked up in a palette. That keeps every sprite readable in code
 * and lets fur, kit and boot colours be swapped by changing the palette alone.
 */

/** A colour per cell; null is see-through. */
export type Grid = (string | null)[][];

/** The character that means "nothing here" in art rows. */
export const EMPTY = ".";
/** In a layer, this character rubs out what is underneath. */
export const ERASE = "_";

export interface Layer {
  /** Where the layer's top-left cell lands on the canvas. */
  x: number;
  y: number;
  rows: readonly string[];
  /** Colour for each character used in `rows`. */
  palette: Readonly<Record<string, string>>;
}

export function blankGrid(width: number, height: number): Grid {
  return Array.from({ length: height }, () => new Array<string | null>(width).fill(null));
}

/** Paints a layer onto a grid in place. Cells outside the grid are ignored. */
export function paint(grid: Grid, layer: Layer): void {
  layer.rows.forEach((row, dy) => {
    [...row].forEach((char, dx) => {
      if (char === EMPTY) return;
      const y = layer.y + dy;
      const x = layer.x + dx;
      const line = grid[y];
      if (!line || x < 0 || x >= line.length) return;

      if (char === ERASE) {
        line[x] = null;
        return;
      }
      const colour = layer.palette[char];
      if (colour === undefined) throw new Error(`No colour for "${char}" in this layer`);
      line[x] = colour;
    });
  });
}

/** Paints layers in order, later ones on top. */
export function compose(width: number, height: number, layers: readonly Layer[]): Grid {
  const grid = blankGrid(width, height);
  for (const layer of layers) paint(grid, layer);
  return grid;
}

export interface Run {
  x: number;
  y: number;
  width: number;
  colour: string;
}

/**
 * The grid as horizontal runs of one colour. Drawing one rectangle per run instead of
 * one per pixel keeps the SVG small.
 */
export function toRuns(grid: Grid): Run[] {
  const runs: Run[] = [];
  grid.forEach((line, y) => {
    let x = 0;
    while (x < line.length) {
      const colour = line[x];
      if (!colour) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < line.length && line[end] === colour) end++;
      runs.push({ x, y, width: end - x, colour });
      x = end;
    }
  });
  return runs;
}
