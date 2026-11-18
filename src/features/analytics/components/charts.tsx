"use client";

import { useId, useState } from "react";

/**
 * Small, dependency-free charts for the dashboard, drawn as SVG. One measure per chart,
 * one axis; colours validated against the night background (see the dataviz notes in
 * CLAUDE.md). Every chart has a hover read-out, and the dashboard has a table view.
 */

export const SERIES = {
  blue: "#3987e5",
  aqua: "#199e70",
  orange: "#d95926",
} as const;

const GRID = "rgb(169 176 214 / 0.18)";

/** A headline number with its label and an optional note underneath. */
export function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="pixel-panel flex flex-col gap-1 p-3">
      <p className="font-pixel text-[9px] tracking-wide text-chalk-dim">{label}</p>
      <p className="font-pixel text-lg text-chalk tabular-nums">{value}</p>
      {note ? <p className="text-base leading-tight text-chalk-dim">{note}</p> : null}
    </div>
  );
}

interface Point {
  label: string;
  value: number;
}

/** A line over time with a soft wash under it, a crosshair and a read-out on hover. */
export function TrendChart({
  title,
  points,
  format,
  colour = SERIES.blue,
}: {
  title: string;
  points: readonly Point[];
  format: (value: number) => string;
  colour?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const gradient = useId();
  const width = 600;
  const height = 160;
  const max = Math.max(1, ...points.map((point) => point.value));
  const top = niceCeiling(max);
  const x = (index: number) =>
    points.length <= 1 ? width / 2 : (index / (points.length - 1)) * width;
  const y = (value: number) => height - (value / top) * height;
  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const shown = hover !== null ? points[hover] : null;

  return (
    <figure className="pixel-panel flex flex-col gap-2 p-3">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-pixel text-[10px] text-chalk">{title.toUpperCase()}</span>
        <span className="text-lg text-chalk-dim tabular-nums">
          {shown ? `${shown.label}: ${format(shown.value)}` : `Total ${format(total)}`}
        </span>
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-36 w-full overflow-visible"
          role="img"
          aria-label={`${title}: ${points.map((p) => `${p.label} ${format(p.value)}`).join(", ")}`}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colour} stopOpacity="0.22" />
              <stop offset="100%" stopColor={colour} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((step) => (
            <line
              key={step}
              x1={0}
              x2={width}
              y1={height - step * height}
              y2={height - step * height}
              stroke={GRID}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {points.length > 1 ? (
            <polygon points={`0,${height} ${line} ${width},${height}`} fill={`url(#${gradient})`} />
          ) : null}
          <polyline
            points={line}
            fill="none"
            stroke={colour}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {hover !== null && shown ? (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={0}
              y2={height}
              stroke="rgb(242 244 255 / 0.4)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {points.map((point, index) => (
            <rect
              key={point.label}
              x={x(index) - width / Math.max(points.length, 1) / 2}
              y={0}
              width={width / Math.max(points.length, 1)}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHover(index)}
              onTouchStart={() => setHover(index)}
            />
          ))}
        </svg>
        {hover !== null && shown ? (
          <span
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-night-deep"
            style={{
              left: `${(x(hover) / width) * 100}%`,
              top: `${(y(shown.value) / height) * 100}%`,
              backgroundColor: colour,
            }}
          />
        ) : null}
      </div>
      <div className="flex justify-between text-base text-chalk-dim tabular-nums">
        <span>{points[0]?.label}</span>
        <span>top {format(top)}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
    </figure>
  );
}

export interface BarRow {
  key: string;
  value: number;
  /** Shown after the value, e.g. "120 visitors". */
  detail?: string;
}

/** A ranked list with a bar behind each row, longest first. */
export function BarList({
  title,
  rows,
  format,
  empty = "Nothing yet.",
  colour = SERIES.blue,
}: {
  title: string;
  rows: readonly BarRow[];
  format: (value: number) => string;
  empty?: string;
  colour?: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section className="pixel-panel flex flex-col gap-2 p-3">
      <h3 className="font-pixel text-[10px] text-chalk">{title.toUpperCase()}</h3>
      {rows.length === 0 ? <p className="text-lg text-chalk-dim">{empty}</p> : null}
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.key} className="relative flex items-center gap-2 px-2 py-0.5 text-lg">
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-r"
              style={{
                width: `${Math.max(2, (row.value / max) * 100)}%`,
                backgroundColor: colour,
                opacity: 0.22,
              }}
            />
            <span className="relative min-w-0 flex-1 truncate" title={row.key}>
              {row.key || "(none)"}
            </span>
            <span className="relative shrink-0 text-chalk tabular-nums">
              {format(row.value)}
              {row.detail ? <span className="text-chalk-dim"> · {row.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Columns from a fixed list of labels, such as hours of the day or tiers. */
export function ColumnChart({
  title,
  columns,
  format,
  colour = SERIES.blue,
}: {
  title: string;
  columns: readonly Point[];
  format: (value: number) => string;
  colour?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...columns.map((column) => column.value));
  const shown = hover !== null ? columns[hover] : null;
  return (
    <figure className="pixel-panel flex flex-col gap-2 p-3">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-pixel text-[10px] text-chalk">{title.toUpperCase()}</span>
        <span className="text-lg text-chalk-dim tabular-nums">
          {shown ? `${shown.label}: ${format(shown.value)}` : ""}
        </span>
      </figcaption>
      <div
        className="flex h-32 items-end gap-0.5 border-b border-chalk-dim/30"
        onMouseLeave={() => setHover(null)}
      >
        {columns.map((column, index) => (
          <div
            key={column.label}
            className="flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(index)}
            onTouchStart={() => setHover(index)}
            title={`${column.label}: ${format(column.value)}`}
          >
            <div
              className="w-full max-w-6 rounded-t-[4px] transition-opacity"
              style={{
                height: `${(column.value / max) * 100}%`,
                minHeight: column.value > 0 ? 2 : 0,
                backgroundColor: colour,
                opacity: hover === null || hover === index ? 1 : 0.45,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-base text-chalk-dim">
        <span>{columns[0]?.label}</span>
        <span>{columns.at(-1)?.label}</span>
      </div>
    </figure>
  );
}

/** Rounds a maximum up to a clean axis top: 1, 2, 5, 10, 20, 50... */
function niceCeiling(value: number): number {
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((multiple) => multiple * power >= value) ?? 10;
  return step * power;
}
