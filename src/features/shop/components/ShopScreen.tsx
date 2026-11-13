"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { COIN_REWARDS } from "@/config/coins";
import { LifetimeCard } from "@/features/payments";
import { shopApi, ShopApiError } from "../api-client";
import { SHOP_SLOTS, SLOT_LABELS } from "../catalogue";
import type { Shop, ShopItem } from "../types";
import { CoinPacks } from "./CoinPacks";
import { ShopItemCard } from "./ShopItemCard";

/** Kits and avatar items for coins. Direct purchase only: you always see what you get. */
export function ShopScreen() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    shopApi
      .shop()
      .then(setShop)
      .catch(() => setFailed(true));
  }, []);

  async function buy(item: ShopItem) {
    if (!shop) return;
    setBusy(true);
    setMessage(null);
    try {
      const { balance } = await shopApi.buy(item.slot, item.id);
      setShop({
        ...shop,
        balance,
        items: shop.items.map((other) =>
          other.slot === item.slot && other.id === item.id ? { ...other, owned: true } : other,
        ),
      });
      setMessage(`${item.name} is yours. Wear it from your profile.`);
    } catch (failure) {
      setMessage(failure instanceof ShopApiError ? failure.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pr-14">
        <h1 className="font-pixel text-lg leading-relaxed text-floodlight">SHOP</h1>
        {shop ? (
          <p className="border-4 border-stand bg-black px-3 py-1 font-pixel text-xs text-scoreboard">
            {shop.balance.toLocaleString("en-GB")} COINS
          </p>
        ) : null}
      </div>
      <p className="text-chalk-dim">
        Earn coins every day: {COIN_REWARDS.dailyComplete} for finishing the puzzle,{" "}
        {COIN_REWARDS.perGalacticat} for each Galacticat and {COIN_REWARDS.streak.coins} for every{" "}
        {COIN_REWARDS.streak.everyDays} days in a row.
      </p>
      {shop && shop.status !== "signed_in" ? (
        <p className="pixel-panel p-3">
          <Link href="/account" className="text-floodlight underline">
            Sign in
          </Link>{" "}
          to buy items. Coins you earn as a guest come with you.
        </p>
      ) : null}
      {message ? (
        <p role="status" className="pixel-panel border-floodlight p-3">
          {message}
        </p>
      ) : null}

      {failed ? <p className="text-claret">The shop did not load. Try again.</p> : null}
      {!shop && !failed ? <Loader /> : null}
      {shop
        ? SHOP_SLOTS.map((slot) => {
            const items = shop.items.filter((item) => item.slot === slot && item.priceCoins > 0);
            if (items.length === 0) return null;
            return (
              <div key={slot} className="flex flex-col gap-2">
                <h2 className="font-pixel text-xs text-chalk">{SLOT_LABELS[slot].toUpperCase()}</h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {items.map((item) => (
                    <ShopItemCard
                      key={`${item.slot}:${item.id}`}
                      item={item}
                      canBuy={shop.status === "signed_in" && !busy}
                      affordable={shop.balance >= item.priceCoins}
                      onBuy={() => void buy(item)}
                    />
                  ))}
                </ul>
              </div>
            );
          })
        : null}

      <LifetimeCard />
      <CoinPacks />

      <Link href="/" className="pixel-button px-4 py-3 text-xs">
        BACK TO HOME
      </Link>
    </section>
  );
}
