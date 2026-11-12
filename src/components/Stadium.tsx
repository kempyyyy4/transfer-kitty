/**
 * A pixel stadium at night: sky, floodlights, packed stands and the pitch.
 * Drawn at 160 by 90 pixels and scaled up. The crowd and stars come from a fixed seed, so
 * the server and the browser draw exactly the same picture.
 */

const WIDTH = 160;
const HEIGHT = 90;
const STAND_TOP = 38;
const PITCH_TOP = 62;

const CROWD_COLOURS = ["#e23d3d", "#f2f4ff", "#4fc3f7", "#ffd23f", "#2b5fb8", "#f29ab0", "#7a1f3d"];

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

function stars() {
  const random = seeded(7);
  return Array.from({ length: 40 }, () => ({
    x: Math.floor(random() * WIDTH),
    y: Math.floor(random() * (STAND_TOP - 12)),
    bright: random() > 0.7,
  }));
}

function crowd() {
  const random = seeded(42);
  const dots: { x: number; y: number; colour: string }[] = [];
  for (let y = STAND_TOP + 4; y < PITCH_TOP - 3; y += 2) {
    for (let x = 1; x < WIDTH; x += 2) {
      if (random() < 0.82) {
        const colour = CROWD_COLOURS[Math.floor(random() * CROWD_COLOURS.length)] ?? "#fff";
        dots.push({ x: x + (y % 4 === 0 ? 1 : 0), y, colour });
      }
    }
  }
  return dots;
}

const STARS = stars();
const CROWD = crowd();

function Floodlight({ x, flip }: { x: number; flip: boolean }) {
  const beam = flip
    ? `${x},14 ${x - 70},${PITCH_TOP} ${x - 20},${PITCH_TOP}`
    : `${x + 8},14 ${x + 78},${PITCH_TOP} ${x + 28},${PITCH_TOP}`;
  return (
    <g>
      {/* fillOpacity, not opacity: the glow animation changes opacity and would undo it. */}
      <polygon points={beam} fill="#fff6c2" fillOpacity={0.07} className="animate-floodlight" />
      <rect x={x + 3} y={18} width={2} height={STAND_TOP - 18} fill="#3a4266" />
      <rect x={x} y={10} width={8} height={8} fill="#2a3150" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((column) => (
          <rect
            key={`${row}-${column}`}
            x={x + 1 + column * 2}
            y={11 + row * 2}
            width={1}
            height={1}
            fill="#fff6c2"
          />
        )),
      )}
    </g>
  );
}

export function Stadium({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
    >
      <rect width={WIDTH} height={HEIGHT} fill="#060914" />
      <rect y={12} width={WIDTH} height={14} fill="#0b1026" />
      <rect y={26} width={WIDTH} height={12} fill="#111836" />
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

      <rect y={STAND_TOP} width={WIDTH} height={PITCH_TOP - STAND_TOP} fill="#1a2140" />
      <rect y={STAND_TOP} width={WIDTH} height={2} fill="#2a3360" />
      {CROWD.map((dot) => (
        <rect
          key={`${dot.x}-${dot.y}`}
          x={dot.x}
          y={dot.y}
          width={1}
          height={1}
          fill={dot.colour}
        />
      ))}
      <rect y={PITCH_TOP - 2} width={WIDTH} height={2} fill="#0d1230" />

      <Floodlight x={6} flip={false} />
      <Floodlight x={146} flip />

      {Array.from({ length: 7 }, (_, band) => (
        <rect
          key={band}
          y={PITCH_TOP + band * 4}
          width={WIDTH}
          height={4}
          fill={band % 2 === 0 ? "#1f8a3a" : "#29a646"}
        />
      ))}
      <rect y={PITCH_TOP + 1} width={WIDTH} height={1} fill="#e8f5e9" />
      <rect x={WIDTH / 2} y={PITCH_TOP + 1} width={1} height={HEIGHT - PITCH_TOP} fill="#e8f5e9" />
    </svg>
  );
}
