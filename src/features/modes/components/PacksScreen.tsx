"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { PACK_PRICE_PENCE } from "@/config/products";
import { GameScreen } from "@/features/game";
import { BuyButton, formatPrice, useAccess } from "@/features/payments";
import { modesApi } from "../api-client";
import type { PackSummary } from "../types";

/** Themed packs: buy once, then play rounds of 7 from the pack. */
export function PacksScreen() {
  const access = useAccess();
  const [packs, setPacks] = useState<PackSummary[] | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    modesApi
      .packs()
      .then(setPacks)
      .catch(() => setPacks([]));
  }, []);

  if (playing) return <GameScreen round={{ mode: "pack", packId: playing }} />;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-pixel text-lg leading-relaxed text-floodlight">THEMED PACKS</h1>
      <p className="text-xl">
        {formatPrice(PACK_PRICE_PENCE)} each, yours to keep. Rounds of 7 from the pack, new
        questions first. Just for fun: no Top Kitties, no coins.
      </p>
      {packs === null || access === null ? <Loader /> : null}
      {packs?.length === 0 ? <p>No packs are on sale yet.</p> : null}
      {packs && access ? (
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
                    onClick={() => setPlaying(pack.id)}
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
      ) : null}
      <Link href="/" className="pixel-button px-4 py-3 text-xs">
        BACK TO HOME
      </Link>
    </section>
  );
}
