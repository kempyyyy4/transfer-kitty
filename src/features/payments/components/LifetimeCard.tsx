import { LIFETIME_UNLOCK } from "@/config/products";
import { formatPrice } from "../products";
import { BuyButton } from "./BuyButton";

/** The one-off unlock, as offered on the shop and on locked screens. */
export function LifetimeCard() {
  return (
    <div className="pixel-panel flex flex-col items-center gap-2 border-floodlight p-4 text-center">
      <p className="font-pixel text-xs text-floodlight">LIFETIME UNLOCK</p>
      <ul className="text-lg">
        <li>Unlimited: endless rounds of 7</li>
        <li>Archive: replay any past day</li>
        <li>Nine Lives: miss a day a month, keep your streak</li>
        <li>No ads</li>
      </ul>
      <p className="font-pixel text-sm text-scoreboard">
        {formatPrice(LIFETIME_UNLOCK.pricePence)} ONCE
      </p>
      <BuyButton product={LIFETIME_UNLOCK.key} label="UNLOCK FOR GOOD" />
      <p className="text-chalk-dim">Unlimited and Archive rounds do not count on Top Kitties.</p>
    </div>
  );
}
