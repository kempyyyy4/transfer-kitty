"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TIERS } from "@/config/tiers";
import { KitMascot, TierSprite } from "@/features/avatar";
import { formatFee } from "@/features/scoring";

/** How far apart the tier kitties stand along the line, in pixels. */
const SPACING = 132;
/** The ball travels for this long, plus a little more for each tier further along. */
const BASE_TRAVEL_MS = 900;
const TRAVEL_MS_PER_TIER = 170;
/** How long each kind of first touch takes, before the fee is shown. */
const CONTROL_MS = { fumble: 900, heavy: 900, clean: 700, juggle: 1300, star: 1900 } as const;

type Control = keyof typeof CONTROL_MS;

const TIERS_IN_ORDER = [...TIERS].sort((a, b) => a.level - b.level);

/** Poor tiers miscontrol the ball; the best ones show off with keepy-ups. */
function controlFor(level: number): Control {
  if (level <= 1) return "fumble";
  if (level <= 3) return "heavy";
  if (level <= 5) return "clean";
  if (level === 6) return "juggle";
  return "star";
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Props {
  tier: number;
  /** Called once the ball has been controlled, or straight away with reduced motion. */
  onDone: () => void;
}

/**
 * After each answer, Kit kicks the ball down a line of the tier kitties. The ball stays in
 * the middle while the line slides past, until the kitty of the tier you earned controls
 * it: the poorer the tier, the worse the touch. Tap to skip.
 */
export function BallJourney({ tier, onDone }: Props) {
  const [phase, setPhase] = useState<"ready" | "travelling" | "control">("ready");
  const finished = useRef(false);
  const onDoneRef = useRef(onDone);
  const control = controlFor(tier);
  const travelMs = BASE_TRAVEL_MS + tier * TRAVEL_MS_PER_TIER;

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onDoneRef.current();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const skip = setTimeout(finish, 0);
      return () => clearTimeout(skip);
    }
    const start = setTimeout(() => setPhase("travelling"), 350);
    const arrive = setTimeout(() => setPhase("control"), 350 + travelMs);
    const done = setTimeout(finish, 350 + travelMs + CONTROL_MS[control]);
    return () => [start, arrive, done].forEach(clearTimeout);
  }, [travelMs, control, finish]);

  const offset = phase === "ready" ? 0 : (tier + 1) * SPACING;

  return (
    <button
      type="button"
      onClick={finish}
      aria-label="Skip the animation"
      className="relative h-48 w-full overflow-hidden border-4 border-stand bg-turf/40"
    >
      <div className="absolute inset-x-0 bottom-9 h-1 bg-chalk/70" />
      <div
        className="absolute bottom-9 left-1/2"
        style={{
          transform: `translateX(${-offset}px)`,
          transition:
            phase === "ready" ? "none" : `transform ${travelMs}ms cubic-bezier(0.15, 0.7, 0.25, 1)`,
        }}
      >
        <div className="absolute bottom-0 -translate-x-[115%]">
          <KitMascot scale={3} className={phase === "ready" ? "animate-kick" : ""} />
        </div>
        {TIERS_IN_ORDER.map((marker) => (
          <div
            key={marker.level}
            className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: (marker.level + 1) * SPACING }}
          >
            <span className="mb-1 font-pixel text-[8px] whitespace-nowrap text-chalk drop-shadow-[1px_1px_0_#000]">
              {marker.name.toUpperCase()} · {formatFee(marker.feeGbp)}
            </span>
            <TierSprite spriteKey={marker.spriteKey} label="" scale={3} />
          </div>
        ))}
      </div>
      <Ball phase={phase} control={control} />
    </button>
  );
}

/** The ball, always in the middle: spinning while it travels, then controlled. */
function Ball({ phase, control }: { phase: string; control: Control }) {
  const motion =
    phase === "travelling" ? "animate-ball-spin" : phase === "control" ? `animate-${control}` : "";
  return (
    <svg
      viewBox="0 0 4 4"
      shapeRendering="crispEdges"
      aria-hidden
      className={`absolute bottom-[38px] left-1/2 h-4 w-4 -translate-x-1/2 ${motion}`}
    >
      <rect x={1} width={2} height={4} fill="#f2f4ff" />
      <rect y={1} width={4} height={2} fill="#f2f4ff" />
      <rect x={1} y={1} width={1} height={1} fill="#141414" />
      <rect x={2} y={2} width={1} height={1} fill="#141414" />
    </svg>
  );
}
