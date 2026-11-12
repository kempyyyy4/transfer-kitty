import { COIN_PACKS } from "@/config/coins";

const formatPence = (pence: number) => `£${(pence / 100).toFixed(2)}`;

/** Coin packs for real money. Payments arrive in a later stage, so these are shown only. */
export function CoinPacks() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-pixel text-xs text-chalk">COIN PACKS</h2>
      <ul className="grid grid-cols-3 gap-2">
        {COIN_PACKS.map((pack) => (
          <li
            key={pack.id}
            className="pixel-panel flex flex-col items-center gap-1 p-2 text-center"
          >
            <span className="font-pixel text-[10px] text-scoreboard">
              {pack.coins.toLocaleString("en-GB")}
            </span>
            <span>{formatPence(pack.pricePence)}</span>
            <span className="font-pixel text-[8px] text-chalk-dim">SOON</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
