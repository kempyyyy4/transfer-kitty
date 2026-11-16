"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TIERS } from "@/config/tiers";
import { KitMascot, TierSprite } from "@/features/avatar";
import { playKick, playTick } from "@/features/audio";
import { formatFee } from "@/features/scoring";
import {
  distanceFor,
  easeOutCubic,
  flightMs,
  heightAt,
  powerFor,
  RECEIVER_MOTIONS,
  RUN_UP_MS,
  SPACING,
  STRIKE_MS,
  TOUCH_MOTIONS,
  touchFor,
} from "./kick-motion";

const TIERS_IN_ORDER = [...TIERS].sort((a, b) => a.level - b.level);
const BALL_PX = 18;
/** Where the ball sits relative to Kit's feet at the start. */
const BALL_START = 26;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Props {
  tier: number;
  /** Called once the receiving kitty has the ball under control (or straight away). */
  onLanded: () => void;
}

/**
 * After each answer: Kit takes a run-up and kicks the ball down the line of tier kitties.
 * The rarer the answer, the harder the kick: higher, further and longer in the air. The
 * camera follows the ball until the kitty of the tier earned takes it, with a touch that
 * matches their class. Tap to skip.
 */
export function KickStage({ tier, onLanded }: Props) {
  const stage = useRef<HTMLButtonElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const spin = useRef<SVGSVGElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const kit = useRef<HTMLDivElement>(null);
  const receiver = useRef<HTMLDivElement>(null);
  const [arrived, setArrived] = useState(false);
  const [passing, setPassing] = useState(-1);
  const landed = useRef(false);
  const onLandedRef = useRef(onLanded);

  useEffect(() => {
    onLandedRef.current = onLanded;
  }, [onLanded]);

  const land = useCallback(() => {
    if (landed.current) return;
    landed.current = true;
    onLandedRef.current();
  }, []);

  /** Puts the ball, its shadow and the camera where they belong at distance `x`. */
  const place = useCallback((x: number, height: number) => {
    track.current?.style.setProperty("transform", `translateX(${-x}px)`);
    ball.current?.style.setProperty("transform", `translate(${x}px, ${-height}px)`);
    spin.current?.style.setProperty("transform", `rotate(${(x / (Math.PI * BALL_PX)) * 360}deg)`);
    shadow.current?.style.setProperty(
      "transform",
      `translateX(${x}px) scale(${Math.max(0.35, 1 - height / 160)})`,
    );
  }, []);

  useEffect(() => {
    place(BALL_START, 0);
    if (prefersReducedMotion()) {
      place(distanceFor(tier), 0);
      const skip = setTimeout(() => {
        setArrived(true);
        land();
      }, 0);
      return () => clearTimeout(skip);
    }

    const power = powerFor(tier);
    const flight = flightMs(tier);
    const distance = distanceFor(tier);
    const animations: Animation[] = [];
    let frame = 0;

    // The run-up: a step back, then into the ball.
    const runUp = kit.current?.animate(
      [
        { transform: "translateX(0) rotate(0)" },
        { transform: "translateX(-16px) rotate(-4deg)", offset: 0.55 },
        { transform: "translateX(6px) rotate(6deg)" },
      ],
      { duration: RUN_UP_MS, easing: "ease-in", fill: "forwards" },
    );
    if (runUp) animations.push(runUp);

    const strike = setTimeout(() => {
      playKick();
      // The ball squashes against the boot, and a hard kick shakes the screen.
      const squash = spin.current?.animate([{ scale: "1.4 0.65" }, { scale: "1 1" }], {
        duration: STRIKE_MS * 2,
        easing: "ease-out",
      });
      const amount = 2 + 8 * power;
      const shake = stage.current?.animate(
        [
          { transform: "translate(0, 0)" },
          { transform: `translate(${-amount}px, ${amount / 2}px)` },
          { transform: `translate(${amount}px, ${-amount / 2}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: 180 + 140 * power, easing: "ease-out" },
      );
      for (const animation of [squash, shake]) if (animation) animations.push(animation);

      let began = 0;
      let lastPassed = -1;
      frame = requestAnimationFrame(function fly(now) {
        began ||= now;
        const t = Math.min(1, (now - began) / flight);
        const x = BALL_START + (distance - BALL_START) * easeOutCubic(t);
        place(x, heightAt(t, power));

        const passed = Math.floor((x + 26) / SPACING) - 1;
        if (passed > lastPassed && passed >= 0 && passed < tier) {
          lastPassed = passed;
          setPassing(passed);
          playTick(passed);
        }
        if (t < 1) {
          frame = requestAnimationFrame(fly);
          return;
        }
        setPassing(-1);
        setArrived(true);
      });
    }, RUN_UP_MS - 40);

    return () => {
      clearTimeout(strike);
      cancelAnimationFrame(frame);
      for (const animation of animations) animation.cancel();
    };
  }, [tier, place, land]);

  // The receiving kitty's touch, then the result.
  useEffect(() => {
    if (!arrived || landed.current || prefersReducedMotion()) return;
    const touch = touchFor(tier);
    const motion = TOUCH_MOTIONS[touch];
    const onBall = ball.current?.firstElementChild?.animate(motion.frames, {
      duration: motion.durationMs,
      fill: "forwards",
    });
    const onKitty = receiver.current?.animate(RECEIVER_MOTIONS[touch], {
      duration: motion.durationMs,
      easing: "ease-in-out",
    });
    const done = setTimeout(land, Math.min(motion.durationMs, 1400));
    return () => {
      clearTimeout(done);
      onBall?.cancel();
      onKitty?.cancel();
    };
  }, [arrived, tier, land]);

  return (
    <button
      ref={stage}
      type="button"
      onClick={() => {
        place(distanceFor(tier), 0);
        setArrived(true);
        land();
      }}
      aria-label="Skip the kick"
      className="relative block h-full max-h-[260px] min-h-[180px] w-full overflow-hidden"
    >
      <div className="absolute inset-x-0 bottom-0 h-10 bg-turf" />
      <div ref={track} className="absolute bottom-10 left-1/2 will-change-transform">
        <div
          className="absolute top-0 -left-[50vw] h-10 bg-[repeating-linear-gradient(90deg,#1f8a3a_0,#1f8a3a_60px,#29a646_60px,#29a646_120px)]"
          style={{ width: `calc(100vw + ${9 * SPACING}px)` }}
        />
        <div className="absolute bottom-0 -translate-x-[110%]" ref={kit}>
          <KitMascot scale={4} />
        </div>
        {TIERS_IN_ORDER.map((marker) => {
          const here = arrived && marker.level === tier;
          return (
            <div
              key={marker.level}
              className={`absolute bottom-0 flex -translate-x-1/2 flex-col items-center transition-transform duration-300 ease-out ${
                here ? "scale-125" : marker.level === passing ? "scale-110" : ""
              }`}
              style={{ left: (marker.level + 1) * SPACING }}
            >
              <span
                className="mb-2 flex max-w-[128px] flex-col items-center border-2 border-black px-1 py-0.5 text-center font-pixel text-[8px] leading-tight text-black"
                style={{ backgroundColor: marker.colour }}
              >
                <span>{marker.name.toUpperCase()}</span>
                <span>{formatFee(marker.feeGbp)}</span>
              </span>
              <div ref={marker.level === tier ? receiver : undefined}>
                <TierSprite spriteKey={marker.spriteKey} label="" scale={4} />
              </div>
            </div>
          );
        })}
        <div
          ref={shadow}
          className="absolute -bottom-1 left-0 h-1.5 w-5 -translate-x-1/2 bg-black/50"
        />
        <div ref={ball} className="absolute bottom-0 left-0">
          <div className="-translate-x-1/2">
            <svg
              ref={spin}
              viewBox="0 0 5 5"
              shapeRendering="crispEdges"
              aria-hidden
              width={BALL_PX}
              height={BALL_PX}
            >
              <rect x={1} width={3} height={5} fill="#f2f4ff" />
              <rect y={1} width={5} height={3} fill="#f2f4ff" />
              <rect x={2} y={2} width={1} height={1} fill="#141414" />
              <rect x={1} y={0} width={1} height={1} fill="#141414" />
              <rect x={3} y={4} width={1} height={1} fill="#141414" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}
