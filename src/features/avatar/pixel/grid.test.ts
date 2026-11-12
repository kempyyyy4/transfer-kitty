import { describe, expect, it } from "vitest";
import { compose, toRuns } from "./grid";

const RED = "#f00";
const BLUE = "#00f";

describe("compose", () => {
  it("paints characters with their palette colour and leaves dots see-through", () => {
    const grid = compose(3, 1, [{ x: 0, y: 0, rows: ["r.b"], palette: { r: RED, b: BLUE } }]);

    expect(grid).toEqual([[RED, null, BLUE]]);
  });

  it("paints later layers on top and lets them rub out cells", () => {
    const grid = compose(3, 1, [
      { x: 0, y: 0, rows: ["rrr"], palette: { r: RED } },
      { x: 1, y: 0, rows: ["b_"], palette: { b: BLUE } },
    ]);

    expect(grid).toEqual([[RED, BLUE, null]]);
  });

  it("ignores cells that fall outside the canvas", () => {
    const grid = compose(2, 1, [{ x: -1, y: 0, rows: ["rrrr"], palette: { r: RED } }]);

    expect(grid).toEqual([[RED, RED]]);
  });

  it("refuses a character the palette does not name", () => {
    expect(() => compose(1, 1, [{ x: 0, y: 0, rows: ["z"], palette: {} }])).toThrow(/"z"/);
  });
});

describe("toRuns", () => {
  it("joins neighbouring cells of one colour into a single run", () => {
    expect(toRuns([[RED, RED, null, BLUE]])).toEqual([
      { x: 0, y: 0, width: 2, colour: RED },
      { x: 3, y: 0, width: 1, colour: BLUE },
    ]);
  });
});
