import { toRuns, type Grid } from "../pixel/grid";

interface Props {
  grid: Grid;
  /** Screen pixels per art pixel. */
  scale?: number;
  label: string;
  className?: string;
}

/** Draws a pixel grid as crisp SVG, one rectangle per run of a colour. */
export function PixelSprite({ grid, scale = 6, label, className }: Props) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  return (
    <svg
      // An empty label means decoration, such as an avatar beside a name already read out.
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      className={className}
    >
      {toRuns(grid).map((run) => (
        <rect
          key={`${run.x}-${run.y}`}
          x={run.x}
          y={run.y}
          width={run.width}
          height={1}
          fill={run.colour}
        />
      ))}
    </svg>
  );
}
