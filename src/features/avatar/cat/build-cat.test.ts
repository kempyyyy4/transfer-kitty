import { describe, expect, it } from "vitest";
import { BODY_ROWS, CAT_WIDTH, EARS } from "./base";
import { buildCat, CANVAS_HEIGHT, CANVAS_WIDTH, MARGIN, shirtColour } from "./build-cat";
import type { CatLook } from "./look";

const LOOK: CatLook = {
  fur: "#5f7a99",
  furShade: "#485e78",
  muzzle: "#e9eef5",
  eyes: "#3fd17a",
  ears: "pointy",
  markings: "none",
  kit: { primary: "#13a39a", secondary: "#f5c518", pattern: "plain", shorts: "#0d3b4f" },
  boots: "#e23d3d",
  accessories: [],
};

/** A cell of the cat, in the cat's own coordinates. */
function cell(look: CatLook, x: number, y: number) {
  return buildCat(look)[y + MARGIN]?.[x + MARGIN] ?? null;
}

describe("the cat drawing", () => {
  it("has every row the same width", () => {
    for (const rows of [...Object.values(EARS), BODY_ROWS]) {
      for (const row of rows) expect(row).toHaveLength(CAT_WIDTH);
    }
  });

  it("fills a canvas with room round the cat", () => {
    const grid = buildCat(LOOK);

    expect(grid).toHaveLength(CANVAS_HEIGHT);
    expect(grid.every((row) => row.length === CANVAS_WIDTH)).toBe(true);
  });
});

describe("buildCat", () => {
  it("paints fur, eyes and boots in the look's colours", () => {
    expect(cell(LOOK, 2, 5)).toBe(LOOK.fur);
    expect(cell(LOOK, 4, 6)).toBe(LOOK.eyes);
    expect(cell(LOOK, 5, 19)).toBe(LOOK.boots);
  });

  it("swaps colours without changing the drawing", () => {
    const ginger = { ...LOOK, fur: "#d2733a" };

    expect(cell(ginger, 2, 5)).toBe("#d2733a");
    expect(cell(ginger, 4, 6)).toBe(LOOK.eyes);
  });

  it("draws a lion's mane behind the head but never over the face", () => {
    const lion = { ...LOOK, mane: { main: "#8a4b1c", shade: "#6b3612" } };

    expect(cell(lion, 2, 5)).toBe(LOOK.fur);
    expect(cell(lion, -1, 5)).toMatch(/#8a4b1c|#6b3612/);
  });

  it("lets an accessory reach outside the cat", () => {
    const stray = { ...LOOK, accessories: ["binBag" as const] };

    expect(cell(stray, -1, 12)).not.toBeNull();
    expect(cell(LOOK, -1, 12)).toBeNull();
  });
});

describe("shirtColour", () => {
  const kit = { primary: "P", secondary: "S", shorts: "x" };

  it("follows each pattern", () => {
    expect(shirtColour({ ...kit, pattern: "plain" }, 5, 12)).toBe("P");
    expect(shirtColour({ ...kit, pattern: "stripes" }, 5, 12)).toBe("S");
    expect(shirtColour({ ...kit, pattern: "stripes" }, 6, 12)).toBe("P");
    expect(shirtColour({ ...kit, pattern: "hoops" }, 6, 13)).toBe("S");
    expect(shirtColour({ ...kit, pattern: "halves" }, 4, 12)).toBe("P");
    expect(shirtColour({ ...kit, pattern: "halves" }, 10, 12)).toBe("S");
    expect(shirtColour({ ...kit, pattern: "sash" }, 4, 12)).toBe("S");
  });
});
