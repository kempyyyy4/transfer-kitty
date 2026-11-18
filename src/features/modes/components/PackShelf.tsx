"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { PACK_PRICE_PENCE } from "@/config/products";
import { BuyButton, formatPrice, useAccess } from "@/features/payments";
import { modesApi } from "../api-client";
import type { PackSummary } from "../types";

/** Themed packs on sale: buy once, then play rounds from them. */
export function PackShelf({ onPlay }: { onPlay: (packId: string) => void }) {
  const access = useAccess();
  const [packs, setPacks] = useState<PackSummary[] | null>(null);

  useEffect(() => {
    modesApi
      .packs()
      .then(setPacks)
      .catch(() => setPacks([]));
  }, []);

  if (packs === null || access === null) return <Loader />;
  if (packs.length === 0) return <p className="text-chalk-dim">New packs are on the way.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {packs.map((pack) => {
        const owned = access.packIds.includes(pack.id);
        return (
          <li key={pack.id} className="pixel-panel flex flex-col gap-2 p-3">
            <p className="font-pixel text-xs text-floodlight">{pack.name.toUpperCase()}</p>
            {pack.description ? <p className="text-lg">{pack.description}</p> : null}
            <p className="text-chalk-dim">{pack.questionCount} questions</p>
            {owned ? (
              <button
                type="button"
                onClick={() => onPlay(pack.id)}
                className="pixel-button self-start border-floodlight px-3 py-2 text-[10px] text-floodlight"
              >
                PLAY A ROUND
              </button>
            ) : (
              <div className="self-start">
                <BuyButton
                  product={`pack:${pack.id}`}
                  label={`BUY FOR ${formatPrice(PACK_PRICE_PENCE)}`}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
