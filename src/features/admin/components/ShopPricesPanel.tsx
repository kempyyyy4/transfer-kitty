"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { moneyEquivalent, SHOP_SLOTS, SLOT_LABELS } from "@/features/shop";
import { adminApi, type AdminShopItem } from "../api-client";
import { ActionMessage, useAction } from "./use-action";

/** Every kit and avatar item: change its coin price or take it off sale. */
export function ShopPricesPanel() {
  const [items, setItems] = useState<AdminShopItem[] | null>(null);
  const { busy, message, run } = useAction();

  const reload = useCallback(
    () =>
      adminApi
        .shopPrices()
        .then(setItems)
        .catch(() => setItems([])),
    [],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!items) return <Loader />;
  const save = (item: AdminShopItem, priceCoins: number, onSale: boolean) =>
    void run(
      () => adminApi.setShopPrice(item.slot, item.id, priceCoins, onSale),
      `${item.name} saved.`,
    ).then((ok) => (ok ? reload() : undefined));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-chalk-dim">
        A price of 0 makes an item free for everyone. Taking an item off sale hides it from the
        shop; players who own it keep it.
      </p>
      <ActionMessage message={message} />
      {SHOP_SLOTS.map((slot) => (
        <div key={slot} className="flex flex-col gap-1">
          <h2 className="font-pixel text-[10px] text-floodlight">
            {SLOT_LABELS[slot].toUpperCase()}
          </h2>
          <ul className="flex flex-col">
            {items
              .filter((item) => item.slot === slot)
              .map((item) => (
                <PriceRow
                  key={`${item.slot}:${item.id}`}
                  item={item}
                  busy={busy}
                  onSave={(price, onSale) => save(item, price, onSale)}
                />
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface RowProps {
  item: AdminShopItem;
  busy: boolean;
  onSave: (priceCoins: number, onSale: boolean) => void;
}

function PriceRow({ item, busy, onSave }: RowProps) {
  const [price, setPrice] = useState(String(item.priceCoins));
  const parsed = Number(price);
  const valid = price !== "" && Number.isInteger(parsed) && parsed >= 0 && parsed <= 100_000;

  return (
    <li className="flex flex-wrap items-center gap-2 border-b-2 border-stand py-1">
      <span className="min-w-32 flex-1">
        {item.name}
        {item.priceCoins !== item.configPrice ? (
          <span className="text-chalk-dim"> (was {item.configPrice})</span>
        ) : null}
        {!item.onSale ? <span className="text-claret"> · off sale</span> : null}
      </span>
      <input
        aria-label={`Price of ${item.name} in coins`}
        inputMode="numeric"
        value={price}
        onChange={(event) => setPrice(event.target.value.trim())}
        className="pixel-input w-20 p-1 text-base"
      />
      <span className="w-12 text-chalk-dim">{valid ? moneyEquivalent(parsed) : ""}</span>
      <button
        type="button"
        disabled={busy || !valid}
        onClick={() => onSave(parsed, item.onSale)}
        className="pixel-button px-2 py-1 text-[10px]"
      >
        SAVE
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onSave(item.priceCoins, !item.onSale)}
        className="pixel-button px-2 py-1 text-[10px]"
      >
        {item.onSale ? "TAKE OFF SALE" : "PUT ON SALE"}
      </button>
    </li>
  );
}
