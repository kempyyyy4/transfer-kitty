import { COIN_PACKS } from "@/config/coins";
import { BuyButton, formatPrice } from "@/features/payments";

/** Coin packs for real money, through Stripe Checkout. */
export function CoinPacks() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-pixel text-xs text-chalk">COIN PACKS</h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {COIN_PACKS.map((pack) => (
          <li
            key={pack.id}
            className="pixel-panel flex flex-col items-center gap-2 p-2 text-center"
          >
            <span className="font-pixel text-[10px] text-scoreboard">
              {pack.coins.toLocaleString("en-GB")} COINS
            </span>
            <BuyButton product={pack.id} label={`BUY FOR ${formatPrice(pack.pricePence)}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
