export type MenuArtKind = "ball" | "trophy" | "kit" | "shirt" | "calendar";

/**
 * Small pixel pictures behind the menu tiles. Rows of characters, one per pixel:
 * # main colour, + second colour, . empty.
 */
const ART: Record<MenuArtKind, { rows: readonly string[]; main: string; second: string }> = {
  ball: {
    main: "#f2f4ff",
    second: "#141414",
    rows: [
      "...####...",
      "..##++##..",
      ".#+####+#.",
      "##########",
      "##++##++##",
      "##++##++##",
      "##########",
      ".#+####+#.",
      "..##++##..",
      "...####...",
    ],
  },
  trophy: {
    main: "#ffd23f",
    second: "#ffb000",
    rows: [
      "##########",
      "#+######+#",
      "#+######+#",
      ".########.",
      "..######..",
      "...####...",
      "....##....",
      "....##....",
      "...####...",
      "..######..",
    ],
  },
  kit: {
    main: "#5f7a99",
    second: "#13a39a",
    rows: [
      ".#......#.",
      ".##....##.",
      "##########",
      "##########",
      "##########",
      ".########.",
      "..++++++..",
      ".++++++++.",
      ".++++++++.",
      ".++++++++.",
    ],
  },
  shirt: {
    main: "#e23d3d",
    second: "#f2f4ff",
    rows: [
      ".###..###.",
      "####++####",
      "##########",
      "##.####.##",
      "...####...",
      "...####...",
      "...####...",
      "...####...",
      "...####...",
      "...####...",
    ],
  },
  calendar: {
    main: "#4fc3f7",
    second: "#f2f4ff",
    rows: [
      ".#......#.",
      "##########",
      "##########",
      "#++#++#++#",
      "#++#++#++#",
      "##########",
      "#++#++#++#",
      "#++#++#++#",
      "##########",
      "##########",
    ],
  },
};

export function MenuArt({ kind, className }: { kind: MenuArtKind; className?: string }) {
  const art = ART[kind];
  return (
    <svg viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden className={className}>
      {art.rows.flatMap((row, y) =>
        [...row].map((char, x) =>
          char === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={char === "#" ? art.main : art.second}
            />
          ),
        ),
      )}
    </svg>
  );
}
