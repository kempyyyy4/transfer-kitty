/**
 * Short-lived pixel bits for the kick: sparks off the boot and grass puffs where the ball
 * lands. Each is a few squares added to the pitch, animated once and removed.
 */

interface Burst {
  /** Where on the pitch, in the track's pixels. */
  x: number;
  count: number;
  /** How far the bits fly. */
  reach: number;
  colours: readonly string[];
  durationMs: number;
}

function burst(parent: HTMLElement | null, { x, count, reach, colours, durationMs }: Burst) {
  if (!parent) return;
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("span");
    Object.assign(bit.style, {
      position: "absolute",
      bottom: "0",
      left: `${x}px`,
      width: "5px",
      height: "5px",
      backgroundColor: colours[i % colours.length],
    });
    parent.append(bit);
    // Spread the bits across an upward fan, from back-left to forward-right.
    const angle = Math.PI * (0.15 + (0.7 * i) / Math.max(1, count - 1));
    const dx = -Math.cos(angle) * reach;
    const dy = -Math.sin(angle) * reach * 0.7;
    const animation = bit.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0 },
      ],
      { duration: durationMs, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" },
    );
    animation.onfinish = () => bit.remove();
    animation.oncancel = () => bit.remove();
  }
}

/** Sparks off the boot at the strike: more, and further, for a harder kick. */
export function strikeSparks(parent: HTMLElement | null, x: number, power: number) {
  burst(parent, {
    x,
    count: 4 + Math.round(6 * power),
    reach: 18 + 34 * power,
    colours: ["#f2f4ff", "#ffd23f"],
    durationMs: 320,
  });
}

/** Grass and dust kicked up where the ball lands. */
export function grassPuff(parent: HTMLElement | null, x: number, strength: number) {
  burst(parent, {
    x,
    count: 3 + Math.round(4 * strength),
    reach: 10 + 16 * strength,
    colours: ["#29a646", "#c9d1e8"],
    durationMs: 420,
  });
}
