"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TIERS } from "@/config/tiers";
import { KitMascot, TierSprite } from "@/features/avatar";
import { buzz, playKick, playThud, playTick } from "@/features/audio";
import { formatFee } from "@/features/scoring";
import { grassPuff, strikeSparks } from "./kick-effects";
import {
  BOUNCES,
  cameraScaleAt,
  distanceFor,
  easeOutCubic,
  flightMs,
  heightAt,
  hitStopMs,
  powerFor,
  RECEIVER_MOTIONS,
  RECEIVER_READY_AT,
  RUN_UP_MS,
  SPACING,
  STRIKE_MS,
  TOUCH_MOTIONS,
  touchFor,
  TRAIL_FROM_POWER,
  WIND_UP_MS,
} from "./kick-motion";

const TIERS_IN_ORDER = [...TIERS].sort((a, b) => a.level - b.level);
const BALL_PX = 18;
/** Where the ball sits relative to Kit's feet at the start. */
const BALL_START = 26;
/** Ghost balls behind a hard kick, and how many frames apart they sit. */
const TRAIL_LENGTH = 4;
const TRAIL_GAP = 2;
/** Height the line of kitties needs, tallest sign and turf included, before the camera zooms out to fit. */
const STAGE_NEEDS_PX = 220;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Props {
  /** The tier earned, or null while the server is still checking the answer. */
  tier: number | null;
  /** Called once the receiving kitty has the ball under control (or straight away). */
  onLanded: () => void;
}

/**
 * After each answer: Kit steps back while the answer is checked, then runs in and kicks
 * the ball down the line of tier kitties. The rarer the answer, the harder the kick: a
 * longer hold at contact, higher, further and longer in the air, with the camera pulling
 * back to follow it. The kitty of the tier earned gets set, then takes it with a touch
 * that matches their class. Tap to skip.
 */
export function KickStage({ tier, onLanded }: Props) {
  const stage = useRef<HTMLButtonElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const spin = useRef<SVGSVGElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const kit = useRef<HTMLDivElement>(null);
  const receiver = useRef<HTMLDivElement>(null);
  const trail = useRef<(HTMLDivElement | null)[]>([]);
  const mountedAt = useRef(0);
  /** The camera's resting zoom: below 1 on a short screen, so every sign fits. */
  const fit = useRef(1);
  /** How close the camera moves in for the touch: only as far as the screen has room for. */
  const zoomIn = useRef(1.12);
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

  /** Ghost balls following the last few positions; hidden when `history` is empty. */
  const drawTrail = useCallback((history: [number, number][]) => {
    trail.current.forEach((ghost, index) => {
      const point = history[history.length - 1 - (index + 1) * TRAIL_GAP];
      if (!ghost) return;
      ghost.style.opacity = point ? String(0.45 - index * 0.1) : "0";
      if (point) ghost.style.transform = `translate(${point[0]}px, ${-point[1]}px)`;
    });
  }, []);

  /** Jumps straight to the end: the ball at the receiver's feet. */
  const finish = useCallback(
    (to: number) => {
      place(distanceFor(to), 0);
      drawTrail([]);
      camera.current?.style.setProperty("transform", `scale(${fit.current})`);
      setPassing(-1);
      setArrived(true);
    },
    [place, drawTrail],
  );

  // The answer is in: Kit steps back and waits for the verdict.
  useEffect(() => {
    mountedAt.current = performance.now();
    const room = (stage.current?.clientHeight ?? STAGE_NEEDS_PX) / STAGE_NEEDS_PX;
    fit.current = Math.min(1, room);
    zoomIn.current = Math.max(fit.current, Math.min(1.12, room));
    camera.current?.style.setProperty("transform", `scale(${fit.current})`);
    place(BALL_START, 0);
    if (prefersReducedMotion()) return;
    const windUp = kit.current?.animate(
      [{ transform: "translateX(0) rotate(0)" }, { transform: "translateX(-20px) rotate(-6deg)" }],
      { duration: WIND_UP_MS, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)", fill: "forwards" },
    );
    return () => windUp?.cancel();
  }, [place]);

  // The verdict is in: the run, the strike and the flight.
  useEffect(() => {
    if (tier === null) return;
    if (prefersReducedMotion()) {
      const skip = setTimeout(() => {
        finish(tier);
        land();
      }, 0);
      return () => clearTimeout(skip);
    }

    const power = powerFor(tier);
    const flight = flightMs(tier);
    const distance = distanceFor(tier);
    const animations: Animation[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let frame = 0;
    const keep = (animation: Animation | undefined) => {
      if (animation) animations.push(animation);
    };

    function fly() {
      let began = 0;
      let lastPassed = -1;
      let bounced = 0;
      let ready = false;
      const history: [number, number][] = [];
      frame = requestAnimationFrame(function step(now) {
        began ||= now;
        const t = Math.min(1, (now - began) / flight);
        const x = BALL_START + (distance - BALL_START) * easeOutCubic(t);
        const height = heightAt(t, power);
        place(x, height);
        camera.current?.style.setProperty(
          "transform",
          `scale(${fit.current * cameraScaleAt(t, power)})`,
        );
        if (power >= TRAIL_FROM_POWER) {
          history.push([x, height]);
          drawTrail(t < BOUNCES[0].at ? history : []);
        }

        const bounce = BOUNCES[bounced];
        if (bounce && t >= bounce.at) {
          bounced++;
          const strength = bounce.strength * (0.4 + 0.6 * power);
          grassPuff(track.current, x, strength);
          playThud(strength);
        }
        if (!ready && t >= RECEIVER_READY_AT && tier !== 0) {
          ready = true;
          keep(
            receiver.current?.animate(
              [
                { transform: "translateY(0) scaleY(1)" },
                { transform: "translateY(3px) scaleY(0.92)" },
              ],
              { duration: 220, easing: "ease-out", fill: "forwards" },
            ),
          );
        }

        const passed = Math.floor((x + 26) / SPACING) - 1;
        if (passed > lastPassed && passed >= 0 && passed < (tier ?? 0)) {
          lastPassed = passed;
          setPassing(passed);
          playTick(passed);
        }
        if (t < 1) {
          frame = requestAnimationFrame(step);
          return;
        }
        drawTrail([]);
        setPassing(-1);
        setArrived(true);
      });
    }

    function strike() {
      playKick(power);
      buzz(Math.round(10 + 30 * power));
      strikeSparks(track.current, BALL_START, power);
      // Contact: the ball flattens against the boot and everything holds for a beat.
      const hold = hitStopMs(power);
      keep(
        spin.current?.animate(
          [
            { scale: "1.5 0.6" },
            { scale: "1.5 0.6", offset: hold / (hold + STRIKE_MS * 2) },
            { scale: "1 1" },
          ],
          { duration: hold + STRIKE_MS * 2, easing: "ease-out" },
        ),
      );
      const amount = 2 + 9 * power;
      keep(
        stage.current?.animate(
          [
            { transform: "translate(0, 0)" },
            { transform: `translate(${-amount}px, ${amount / 2}px)` },
            { transform: `translate(${amount}px, ${-amount / 2}px)` },
            { transform: `translate(${-amount / 3}px, 0)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: 200 + 160 * power, easing: "ease-out" },
        ),
      );
      timers.push(setTimeout(fly, hold));
    }

    // Give the wind-up its moment even when the verdict comes back at once.
    const waited = performance.now() - mountedAt.current;
    timers.push(
      setTimeout(
        () => {
          keep(
            kit.current?.animate(
              [
                { transform: "translateX(-20px) rotate(-6deg)" },
                { transform: "translateX(8px) rotate(10deg)" },
              ],
              { duration: RUN_UP_MS, easing: "cubic-bezier(0.6, 0, 0.9, 0.4)", fill: "forwards" },
            ),
          );
          timers.push(setTimeout(strike, RUN_UP_MS - 30));
        },
        Math.max(0, WIND_UP_MS - waited),
      ),
    );

    return () => {
      for (const timer of timers) clearTimeout(timer);
      cancelAnimationFrame(frame);
      for (const animation of animations) animation.cancel();
    };
  }, [tier, place, drawTrail, finish, land]);

  // The receiving kitty's touch, with the camera moving in on it, then the result.
  useEffect(() => {
    if (tier === null || !arrived || landed.current || prefersReducedMotion()) return;
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
    const zoom = camera.current?.animate(
      [
        { transform: `scale(${fit.current})` },
        { transform: `scale(${zoomIn.current})`, offset: 0.25 },
        { transform: `scale(${zoomIn.current})`, offset: 0.8 },
        { transform: `scale(${fit.current})` },
      ],
      { duration: motion.durationMs, easing: "ease-in-out" },
    );
    const done = setTimeout(land, Math.min(motion.durationMs, 1400));
    return () => {
      clearTimeout(done);
      onBall?.cancel();
      onKitty?.cancel();
      zoom?.cancel();
    };
  }, [arrived, tier, land]);

  return (
    <button
      ref={stage}
      type="button"
      onClick={() => {
        if (tier === null) return;
        finish(tier);
        land();
      }}
      aria-label="Skip the kick"
      // The pitch fades out at the sides rather than ending in a hard edge.
      className="relative block h-full max-h-[260px] min-h-[180px] w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
    >
      <div
        ref={camera}
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: "50% calc(100% - 40px)" }}
      >
        <div className="absolute -inset-x-[20%] bottom-0 h-10 bg-turf" />
        <div ref={track} className="absolute bottom-10 left-1/2 will-change-transform">
          <div
            className="absolute top-0 -left-[75vw] h-10 bg-[repeating-linear-gradient(90deg,#1f8a3a_0,#1f8a3a_60px,#29a646_60px,#29a646_120px)]"
            style={{ width: `calc(150vw + ${9 * SPACING}px)` }}
          />
          <div className="absolute bottom-0 -translate-x-[110%]" ref={kit}>
            <KitMascot scale={4} />
          </div>
          {TIERS_IN_ORDER.map((marker) => {
            const here = arrived && marker.level === tier;
            return (
              <div
                key={marker.level}
                className={`absolute bottom-0 flex -translate-x-1/2 flex-col origin-bottom items-center transition-transform duration-300 ease-out ${
                  here ? "scale-115" : marker.level === passing ? "scale-105" : ""
                }`}
                style={{ left: (marker.level + 1) * SPACING }}
              >
                <span
                  className="mb-1 flex max-w-[128px] flex-col items-center border-2 border-black px-1 py-0.5 text-center font-pixel text-[8px] leading-tight text-black"
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
          {Array.from({ length: TRAIL_LENGTH }, (_, index) => (
            <div
              key={index}
              ref={(element) => {
                trail.current[index] = element;
              }}
              className="absolute bottom-0 left-0 opacity-0"
            >
              <div
                className="-translate-x-1/2 bg-chalk"
                style={{ width: BALL_PX - 4 - index * 2, height: BALL_PX - 4 - index * 2 }}
              />
            </div>
          ))}
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
      </div>
    </button>
  );
}
