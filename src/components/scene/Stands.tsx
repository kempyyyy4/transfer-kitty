/**
 * The night sky, floodlights and a packed stand, as a wide pixel strip across the top of
 * the scene. The crowd and stars come from a fixed seed, so the server and the browser
 * draw exactly the same picture. Two crowd layers swap back and forth so the fans move.
 */

const WIDTH = 240;
const HEIGHT = 48;
const STAND_TOP = 20;

const CROWD_COLOURS = ["#e23d3d", "#f2f4ff", "#4fc3f7", "#ffd23f", "#2b5fb8", "#f29ab0", "#7a1f3d"];
const FLAG_COLOURS = ["#e23d3d", "#ffd23f", "#4fc3f7", "#f2f4ff"];

/** A small, repeatable random number generator. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(list: readonly T[], random: () => number): T =>
  list[Math.floor(random() * list.length)] as T;

function stars() {
  const random = seeded(7);
  return Array.from({ length: 60 }, () => ({
    x: Math.floor(random() * WIDTH),
    y: Math.floor(random() * (STAND_TOP - 6)),
    bright: random() > 0.7,
  }));
}

/** One frame of the crowd: a dot of colour for most seats. */
function crowd(seed: number) {
  const random = seeded(seed);
  const dots: { x: number; y: number; colour: string }[] = [];
  for (let y = STAND_TOP + 3; y < HEIGHT - 2; y += 2) {
    for (let x = 1; x < WIDTH; x += 2) {
      if (random() < 0.85) {
        dots.push({ x: x + (y % 4 === 0 ? 1 : 0), y, colour: pick(CROWD_COLOURS, random) });
      }
    }
  }
  return dots;
}

function flags() {
  const random = seeded(99);
  return Array.from({ length: 9 }, (_, index) => ({
    x: 12 + index * 26 + Math.floor(random() * 8),
    y: STAND_TOP + 4 + Math.floor(random() * 10),
    colour: pick(FLAG_COLOURS, random),
  }));
}

const STARS = stars();
const CROWD_A = crowd(42);
const CROWD_B = crowd(43);
const FLAGS = flags();

function Dots({ dots }: { dots: readonly { x: number; y: number; colour: string }[] }) {
  return dots.map((dot) => (
    <rect key={`${dot.x}-${dot.y}`} x={dot.x} y={dot.y} width={1} height={1} fill={dot.colour} />
  ));
}

function Floodlight({ x }: { x: number }) {
  return (
    <g>
      <rect x={x + 3} y={8} width={2} height={STAND_TOP - 8} fill="#3a4266" />
      <rect x={x} y={2} width={8} height={7} fill="#2a3150" />
      <rect x={x + 1} y={3} width={6} height={5} fill="#fff6c2" className="animate-floodlight" />
    </g>
  );
}

export function Stands({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
    >
      <rect width={WIDTH} height={HEIGHT} fill="#060914" />
      <rect y={6} width={WIDTH} height={8} fill="#0b1026" />
      <rect y={14} width={WIDTH} height={6} fill="#111836" />
      <g className="animate-twinkle">
        {STARS.map((star) => (
          <rect
            key={`${star.x}-${star.y}`}
            x={star.x}
            y={star.y}
            width={1}
            height={1}
            fill={star.bright ? "#ffffff" : "#6b74a8"}
          />
        ))}
      </g>

      <rect y={STAND_TOP} width={WIDTH} height={HEIGHT - STAND_TOP} fill="#1a2140" />
      <rect y={STAND_TOP} width={WIDTH} height={2} fill="#2a3360" />
      <g className="animate-crowd-a">
        <Dots dots={CROWD_A} />
      </g>
      <g className="animate-crowd-b">
        <Dots dots={CROWD_B} />
      </g>
      {FLAGS.map((flag) => (
        <g key={flag.x} className="animate-flag-wave">
          <rect x={flag.x} y={flag.y - 4} width={1} height={5} fill="#c9c9c9" />
          <rect x={flag.x + 1} y={flag.y - 4} width={3} height={2} fill={flag.colour} />
        </g>
      ))}
      <rect y={HEIGHT - 2} width={WIDTH} height={2} fill="#0d1230" />

      {[10, 70, 160, 222].map((x) => (
        <Floodlight key={x} x={x} />
      ))}
    </svg>
  );
}
