import { KitMascot } from "@/features/avatar";
import { ASIDES, PX_PER_MILLION, TOP_M, ZONES } from "./zones";

/** Kit stays at this height on screen while the world slides past. */
const KIT_FROM_BOTTOM = "27vh";
const WORLD_PX = TOP_M * PX_PER_MILLION;
const MARKER_EVERY_M = 25;

/** Fixed positions, so the server and browser draw the same stars. */
const STARS = Array.from({ length: 70 }, (_, index) => ({
  left: (index * 53) % 100,
  atM: 470 + ((index * 37) % 230),
  bright: index % 4 === 0,
}));

/** Every zone's sky, blended one into the next, from the ground up. */
const SKY = `linear-gradient(to top, ${ZONES.map(
  (zone) => `${zone.sky} ${((zone.fromM / TOP_M) * 100).toFixed(1)}%`,
).join(", ")})`;

interface Props {
  /** How high the kitty is, in pounds. */
  height: number;
  /** True while climbing, for the speed lines behind Kit. */
  moving: boolean;
}

/**
 * The game's backdrop, like a dive in reverse: your kitty is your height. The world
 * slides down past Kit as the kitty grows, zone by zone, from a park pitch to the stars.
 */
export function ClimbWorld({ height, moving }: Props) {
  const risen = (height / 1_000_000) * PX_PER_MILLION;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
      <div
        className="absolute inset-x-0 will-change-transform"
        style={{
          height: `calc(${WORLD_PX}px + 100vh)`,
          bottom: `calc(${KIT_FROM_BOTTOM} - 100vh)`,
          transform: `translateY(${risen}px)`,
          background: SKY,
        }}
      >
        <Ground />
        {STARS.map((star) => (
          <span
            key={star.left * 1000 + star.atM}
            className={`absolute ${star.bright ? "h-1 w-1 bg-chalk" : "h-0.5 w-0.5 bg-chalk-dim"}`}
            style={{
              left: `${star.left}%`,
              bottom: `calc(100vh + ${star.atM * PX_PER_MILLION}px)`,
            }}
          />
        ))}
        {Array.from({ length: TOP_M / MARKER_EVERY_M + 1 }, (_, index) => index * MARKER_EVERY_M)
          .filter((atM) => atM > 0)
          .map((atM) => (
            <Marker key={atM} atM={atM} />
          ))}
        {ZONES.slice(1).map((zone) => (
          <ZoneSign key={zone.name} atM={zone.fromM} name={zone.name} />
        ))}
        {ASIDES.map((aside) => (
          <p
            key={aside.atM}
            className="absolute right-3 font-mono text-lg text-chalk/80"
            style={{ bottom: `calc(100vh + ${aside.atM * PX_PER_MILLION}px)` }}
          >
            {aside.text} ──
          </p>
        ))}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: KIT_FROM_BOTTOM }}>
        {moving ? <SpeedLines /> : null}
        <KitMascot scale={4} />
      </div>
    </div>
  );
}

/** The park pitch everyone starts on. */
function Ground() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[100vh]">
      <div className="pitch absolute inset-x-0 top-0 bottom-0" />
      <div className="absolute inset-x-0 top-0 h-1 bg-chalk/80" />
    </div>
  );
}

function Marker({ atM }: { atM: number }) {
  return (
    <div
      className="absolute left-0 flex items-center gap-2 pl-3"
      style={{ bottom: `calc(100vh + ${atM * PX_PER_MILLION}px)` }}
    >
      <span className="h-0.5 w-4 bg-chalk/50" />
      <span className="font-pixel text-[8px] text-chalk/70">£{atM}M</span>
    </div>
  );
}

function ZoneSign({ atM, name }: { atM: number; name: string }) {
  return (
    <div
      className="absolute inset-x-0 flex items-center gap-2 px-3"
      style={{ bottom: `calc(100vh + ${atM * PX_PER_MILLION}px)` }}
    >
      <span className="h-0.5 flex-1 bg-floodlight/60" />
      <span className="font-pixel text-[10px] text-floodlight">{name}</span>
      <span className="h-0.5 w-6 bg-floodlight/60" />
    </div>
  );
}

/** Streaks below Kit while the kitty climbs. */
function SpeedLines() {
  return (
    <div className="absolute -bottom-16 left-1/2 flex -translate-x-1/2 gap-3">
      {[0, 1, 2].map((line) => (
        <span
          key={line}
          className="animate-speed-line block w-1 bg-chalk/60"
          style={{ height: 40 + line * 12, animationDelay: `${line * 90}ms` }}
        />
      ))}
    </div>
  );
}
