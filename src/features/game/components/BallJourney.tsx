"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TIERS } from "@/config/tiers";
import { KitMascot, TierSprite } from "@/features/avatar";
import { playKick, playTick } from "@/features/audio";
import { formatFee } from "@/features/scoring";
import { controlFor, CONTROL_MOTIONS } from "./ball-control";

/** How far apart the tier kitties stand along the line, in pixels. */
const SPACING = 150;
/** A short wind-up before the kick, so the eye settles on Kit first. */
const WIND_UP_MS = 450;
/** The ball rolls for this long, plus more for each tier further along: more road, more suspense. */
const BASE_TRAVEL_MS = 1800;
const TRAVEL_MS_PER_TIER = 420;
/** The ball is drawn this big, in pixels, and spins as far as it rolls. */
const BALL_SIZE = 20;

const TIERS_IN_ORDER = [...TIERS].sort((a, b) => a.level - b.level);

/** Fast off the boot, then a long slow crawl past the last few kitties. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

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
 * the middle while the line slides past, quickly at first and then slower and slower,
 * ticking past each kitty, until the kitty of the tier you earned controls it: the poorer
 * the tier, the worse the touch. Tap to skip.
 */
export function BallJourney({ tier, onDone }: Props) {
  const [arrived, setArrived] = useState(false);
  const [near, setNear] = useState(-1);
  const track = useRef<HTMLDivElement>(null);
  const ball = useRef<SVGSVGElement>(null);
  const finished = useRef(false);
  const onDoneRef = useRef(onDone);

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

    const distance = (tier + 1) * SPACING;
    const travelMs = BASE_TRAVEL_MS + tier * TRAVEL_MS_PER_TIER;
    let frame = 0;
    let started = 0;
    let lastPassed = -1;

    const roll = (now: number) => {
      started ||= now;
      const t = Math.min(1, (now - started) / travelMs);
      const travelled = distance * easeOut(t);
      track.current?.style.setProperty("transform", `translateX(${-travelled}px)`);
      ball.current?.style.setProperty(
        "transform",
        `rotate(${(travelled / (Math.PI * BALL_SIZE)) * 360}deg)`,
      );

      const passed = Math.floor(travelled / SPACING + 0.5) - 1;
      if (passed !== lastPassed && passed >= 0) {
        lastPassed = passed;
        setNear(passed);
        playTick(passed);
      }
      if (t < 1) {
        frame = requestAnimationFrame(roll);
      } else {
        setArrived(true);
      }
    };

    const kick = setTimeout(() => {
      playKick();
      frame = requestAnimationFrame(roll);
    }, WIND_UP_MS);
    return () => {
      clearTimeout(kick);
      cancelAnimationFrame(frame);
    };
  }, [tier, finish]);

  // The first touch: a short scripted motion for the ball, then the fee.
  useEffect(() => {
    const holder = ball.current?.parentElement;
    if (!arrived || !holder) return;
    const motion = CONTROL_MOTIONS[controlFor(tier)];
    const animation = holder.animate(motion.keyframes, {
      duration: motion.durationMs,
      easing: "ease-in-out",
      fill: "forwards",
    });
    const done = setTimeout(finish, motion.durationMs + 250);
    return () => {
      clearTimeout(done);
      animation.cancel();
    };
  }, [arrived, tier, finish]);

  return (
    <button
      type="button"
      onClick={finish}
      aria-label="Skip the animation"
      className="relative h-64 w-full overflow-hidden border-4 border-black bg-[radial-gradient(ellipse_at_50%_115%,#29a646_0%,#1f8a3a_40%,#0b1026_80%)]"
    >
      <div className="absolute inset-x-0 bottom-12 h-1 bg-chalk/60" />
      <div ref={track} className="absolute bottom-12 left-1/2 will-change-transform">
        <div className="absolute bottom-0 -translate-x-[120%]">
          <KitMascot scale={4} className="animate-kick" />
        </div>
        {TIERS_IN_ORDER.map((marker) => {
          const here = arrived && marker.level === tier;
          const passing = !arrived && marker.level === near;
          return (
            <div
              key={marker.level}
              className={`absolute bottom-0 flex -translate-x-1/2 flex-col items-center transition-transform duration-300 ease-out ${
                here ? "scale-125" : passing ? "scale-110" : "scale-100"
              }`}
              style={{ left: (marker.level + 1) * SPACING }}
            >
              <span
                className={`mb-2 border-2 border-black px-1 font-pixel text-[8px] whitespace-nowrap ${
                  here ? "bg-floodlight text-black" : "bg-night-deep/90 text-chalk"
                }`}
              >
                {marker.name.toUpperCase()} {formatFee(marker.feeGbp)}
              </span>
              <TierSprite spriteKey={marker.spriteKey} label="" scale={4} />
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <svg
          ref={ball}
          viewBox="0 0 5 5"
          shapeRendering="crispEdges"
          aria-hidden
          width={BALL_SIZE}
          height={BALL_SIZE}
          className="drop-shadow-[0_3px_0_rgb(0_0_0/0.5)]"
        >
          <rect x={1} width={3} height={5} fill="#f2f4ff" />
          <rect y={1} width={5} height={3} fill="#f2f4ff" />
          <rect x={2} y={2} width={1} height={1} fill="#141414" />
          <rect x={1} y={0} width={1} height={1} fill="#141414" />
          <rect x={3} y={4} width={1} height={1} fill="#141414" />
        </svg>
      </div>
    </button>
  );
}
