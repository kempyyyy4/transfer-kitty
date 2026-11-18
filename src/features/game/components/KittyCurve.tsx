"use client";

import { useEffect, useId, useState } from "react";
import { formatFee } from "@/features/scoring";
import { gameApi } from "../api-client";
import type { KittyDistribution } from "../types";

/** Fewer finished rounds than this and a curve says nothing yet. */
const MIN_PLAYERS = 5;
const WIDTH = 300;
const HEIGHT = 90;

/**
 * Where the player's kitty sits among everyone's that day: a smooth curve of all the
 * day's totals, a marker at theirs, and the share of players they beat.
 */
export function KittyCurve({ sessionId }: { sessionId: string }) {
  const [spread, setSpread] = useState<KittyDistribution | null>(null);
  const gradient = useId();

  useEffect(() => {
    gameApi
      .distribution(sessionId)
      .then(setSpread)
      // Without it the rest of the results still show.
      .catch(() => undefined);
  }, [sessionId]);

  if (!spread) return null;
  if (spread.players < MIN_PLAYERS) {
    return (
      <p className="pixel-panel p-3 text-lg text-chalk-dim">
        The curve of today&apos;s kitties appears once a few more players have finished.
      </p>
    );
  }

  const smooth = smoothed(spread.bins);
  const peak = Math.max(1, ...smooth);
  const points = smooth.map((count, index) => ({
    x: ((index + 0.5) / smooth.length) * WIDTH,
    y: HEIGHT - (count / peak) * (HEIGHT - 6),
  }));
  const line = curveThrough([{ x: 0, y: HEIGHT }, ...points, { x: WIDTH, y: HEIGHT }]);
  const yourX = Math.min(WIDTH, (spread.yours / spread.best) * WIDTH);
  const beatPercent = Math.round((100 * spread.beaten) / Math.max(1, spread.players - 1));

  return (
    <figure className="pixel-panel flex flex-col gap-2 p-4">
      <figcaption className="flex flex-col gap-0.5 text-center">
        <span className="font-pixel text-[10px] tracking-widest text-chalk-dim">
          TODAY&apos;S KITTIES
        </span>
        <span className="text-xl">
          You beat <span className="font-pixel text-base text-floodlight">{beatPercent}%</span> of{" "}
          {spread.players.toLocaleString("en-GB")} players
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-28 w-full overflow-visible"
        role="img"
        aria-label={`Your kitty of ${formatFee(spread.yours)} beat ${beatPercent}% of today's players.`}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd23f" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffd23f" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <line x1={0} x2={WIDTH} y1={HEIGHT} y2={HEIGHT} stroke="rgb(169 176 214 / 0.35)" />
        <path d={`${line} Z`} fill={`url(#${gradient})`} className="animate-reveal-in" />
        <path
          d={line}
          fill="none"
          stroke="#ffd23f"
          strokeWidth={2}
          strokeLinejoin="round"
          className="animate-reveal-in"
        />
        <g className="animate-sprite-pop" style={{ animationDelay: "500ms" }}>
          <line x1={yourX} x2={yourX} y1={0} y2={HEIGHT} stroke="#f2f4ff" strokeWidth={2} />
          <circle cx={yourX} cy={0} r={5} fill="#ffd23f" stroke="#060914" strokeWidth={2} />
        </g>
      </svg>
      <div className="flex justify-between text-base text-chalk-dim tabular-nums">
        <span>£0</span>
        <span className="text-chalk">You: {formatFee(spread.yours)}</span>
        <span>Best: {formatFee(spread.best)}</span>
      </div>
    </figure>
  );
}

/** A light moving average, so a handful of players still draws a smooth hill. */
function smoothed(bins: readonly number[]): number[] {
  return bins.map((_, index) => {
    const around = [bins[index - 1], bins[index], bins[index], bins[index + 1]].filter(
      (value): value is number => value !== undefined,
    );
    return around.reduce((sum, value) => sum + value, 0) / around.length;
  });
}

/** A smooth path through points, with control points halfway between neighbours. */
function curveThrough(points: readonly { x: number; y: number }[]): string {
  const [first, ...rest] = points;
  if (!first) return "";
  let path = `M ${first.x} ${first.y}`;
  let previous = first;
  for (const point of rest) {
    const middleX = (previous.x + point.x) / 2;
    path += ` C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
    previous = point;
  }
  return path;
}
