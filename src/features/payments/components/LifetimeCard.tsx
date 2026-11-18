import { LIFETIME_UNLOCK } from "@/config/products";
import { formatPrice } from "../products";
import { BuyButton } from "./BuyButton";

const PERKS: readonly { name: string; detail: string }[] = [
  { name: "Unlimited", detail: "endless rounds of 7" },
  { name: "Archive", detail: "replay any past day" },
  { name: "Nine Lives", detail: "miss a day a month, keep your streak" },
  { name: "No ads", detail: "" },
];

/** The one-off unlock, as offered on the shop and on locked screens. */
export function LifetimeCard() {
  return (
    <div className="pixel-panel flex flex-col gap-3 border-floodlight bg-[linear-gradient(to_bottom,rgb(255_210_63/0.10),transparent_60%)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-pixel text-sm text-floodlight">LIFETIME UNLOCK</p>
        <p className="font-pixel text-base text-scoreboard">
          {formatPrice(LIFETIME_UNLOCK.pricePence)}{" "}
          <span className="text-[10px] text-chalk-dim">ONCE</span>
        </p>
      </div>
      <ul className="flex flex-col gap-1.5 text-lg">
        {PERKS.map((perk) => (
          <li key={perk.name} className="flex items-start gap-2">
            <Tick />
            <span>
              <span className="text-chalk">{perk.name}</span>
              {perk.detail ? <span className="text-chalk-dim">: {perk.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      <BuyButton product={LIFETIME_UNLOCK.key} label="UNLOCK FOR GOOD" wide />
      <p className="text-center text-base text-chalk-dim">
        Unlimited and Archive rounds do not count on Top Kitties.
      </p>
    </div>
  );
}

/** A small pixel tick in a green square. */
function Tick() {
  return (
    <svg
      viewBox="0 0 7 7"
      width={18}
      height={18}
      shapeRendering="crispEdges"
      aria-hidden
      className="mt-0.5 shrink-0"
    >
      <rect width={7} height={7} fill="#1f8a3a" />
      <rect x={1} y={3} width={1} height={1} fill="#f2f4ff" />
      <rect x={2} y={4} width={1} height={1} fill="#f2f4ff" />
      <rect x={3} y={3} width={1} height={1} fill="#f2f4ff" />
      <rect x={4} y={2} width={1} height={1} fill="#f2f4ff" />
      <rect x={5} y={1} width={1} height={1} fill="#f2f4ff" />
    </svg>
  );
}
