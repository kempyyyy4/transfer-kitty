import { buildCat, KIT_MASCOT, toRuns, type Grid } from "@/features/avatar";

/**
 * Pixel art for generated images (the app icon and the link preview), drawn with plain
 * positioned boxes because image generation does not draw SVG rectangles. Kit and the
 * title come from the same grids as the site, so the icon always matches the game.
 */

export const NIGHT = "#0b1026";
export const NIGHT_DEEP = "#060914";
export const FLOODLIGHT = "#ffd23f";
export const CLARET = "#e23d3d";

/** Kit, the mascot, as drawn on the site. */
export const KIT_GRID: Grid = buildCat(KIT_MASCOT);

/** Kit's head and the top of the kit: the part that still reads at favicon size. */
export const KIT_HEAD_GRID: Grid = KIT_GRID.slice(2, 18).map((row) => row.slice(3, 19));

/** Draws a grid as boxes, `scale` image pixels per art pixel. */
export function GridBoxes({ grid, scale }: { grid: Grid; scale: number }) {
  const width = (grid[0]?.length ?? 0) * scale;
  return (
    <div style={{ display: "flex", position: "relative", width, height: grid.length * scale }}>
      {toRuns(grid).map((run) => (
        <div
          key={`${run.x}-${run.y}`}
          style={{
            position: "absolute",
            left: run.x * scale,
            top: run.y * scale,
            width: run.width * scale,
            height: scale,
            backgroundColor: run.colour,
          }}
        />
      ))}
    </div>
  );
}

/** Letters of the title, 5 by 7, as on an old scoreboard. Only the ones the title needs. */
const GLYPHS: Record<string, readonly string[]> = {
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
};

/** A word in the scoreboard letters, as a grid in one colour with a gap between letters. */
export function wordGrid(word: string, colour: string): Grid {
  const letters = [...word].map((letter) => GLYPHS[letter] ?? []);
  return Array.from({ length: 7 }, (_, row) =>
    letters.flatMap((glyph, index) => [
      ...[...(glyph[row] ?? "")].map((cell) => (cell === "#" ? colour : null)),
      ...(index < letters.length - 1 ? [null] : []),
    ]),
  );
}

/** A word with the site logo's hard black shadow and red edge, drawn as boxes. */
export function PixelWord({ word, scale }: { word: string; scale: number }) {
  const shadow = Math.round(scale * 0.6);
  return (
    <div style={{ display: "flex", position: "relative" }}>
      <div style={{ display: "flex", position: "absolute", left: shadow, top: shadow }}>
        <GridBoxes grid={wordGrid(word, "#000000")} scale={scale} />
      </div>
      <div style={{ display: "flex", position: "absolute", left: -Math.round(scale / 3), top: 0 }}>
        <GridBoxes grid={wordGrid(word, CLARET)} scale={scale} />
      </div>
      <GridBoxes grid={wordGrid(word, FLOODLIGHT)} scale={scale} />
    </div>
  );
}
