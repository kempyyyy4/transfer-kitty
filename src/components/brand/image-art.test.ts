import { describe, expect, it } from "vitest";
import { KIT_HEAD_GRID, wordGrid } from "./image-art";

describe("image art", () => {
  it("draws a word as 5-wide letters, 7 tall, one blank column apart", () => {
    const grid = wordGrid("KITTY", "#ffd23f");
    expect(grid).toHaveLength(7);
    for (const row of grid) expect(row).toHaveLength(5 * 6 - 1);
    // The gap after each letter is empty in every row.
    for (const row of grid) expect(row[5]).toBeNull();
  });

  it("has a letter for every one in the title", () => {
    for (const word of ["TRANSFER", "KITTY"]) {
      const lit = wordGrid(word, "#fff").flat().filter(Boolean).length;
      expect(lit).toBeGreaterThan(word.length * 8);
    }
  });

  it("crops Kit's head to a 16 by 16 square for the icon", () => {
    expect(KIT_HEAD_GRID).toHaveLength(16);
    for (const row of KIT_HEAD_GRID) expect(row).toHaveLength(16);
  });
});
