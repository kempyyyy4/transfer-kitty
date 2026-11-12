"use client";

import { useState } from "react";
import { CatSprite, DEFAULT_CHOICE, lookFor, type AvatarChoice } from "@/features/avatar";
import { moneyEquivalent } from "../catalogue";
import type { ShopItem } from "../types";

/** The default cat wearing just this item, so players see exactly what they are buying. */
function previewChoice(item: ShopItem): AvatarChoice {
  if (item.slot === "accessory") return { ...DEFAULT_CHOICE, accessories: [item.id] };
  return { ...DEFAULT_CHOICE, [item.slot]: item.id };
}

interface Props {
  item: ShopItem;
  canBuy: boolean;
  affordable: boolean;
  onBuy: () => void;
}

export function ShopItemCard({ item, canBuy, affordable, onBuy }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="pixel-panel flex flex-col items-center gap-2 p-2 text-center">
      <CatSprite look={lookFor(previewChoice(item))} label={item.name} scale={4} />
      <p className="text-lg leading-tight">{item.name}</p>
      <p>
        <span className="font-pixel text-[10px] text-scoreboard">{item.priceCoins} COINS</span>
        <span className="block text-chalk-dim">about {moneyEquivalent(item.priceCoins)}</span>
      </p>
      {item.owned ? (
        <p className="font-pixel text-[10px] text-turf-light">OWNED</p>
      ) : confirming ? (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            disabled={!canBuy}
            onClick={() => {
              setConfirming(false);
              onBuy();
            }}
            className="pixel-button border-floodlight px-2 py-1 text-[10px] text-floodlight"
          >
            CONFIRM
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="pixel-button px-2 py-1 text-[10px]"
          >
            CANCEL
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!canBuy || !affordable}
          onClick={() => setConfirming(true)}
          className="pixel-button px-2 py-1 text-[10px]"
        >
          {affordable ? "BUY" : "NOT ENOUGH COINS"}
        </button>
      )}
    </li>
  );
}
