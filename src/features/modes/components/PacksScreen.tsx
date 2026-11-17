"use client";

import { useState } from "react";
import { PACK_PRICE_PENCE } from "@/config/products";
import { GameScreen } from "@/features/game";
import { formatPrice } from "@/features/payments";
import { PackShelf } from "./PackShelf";

/** Themed packs: buy once, then play rounds of 7 from the pack. Also shown in the shop. */
export function PacksScreen() {
  const [playing, setPlaying] = useState<string | null>(null);
  if (playing) return <GameScreen round={{ mode: "pack", packId: playing }} />;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="page-title">THEMED PACKS</h1>
      <p className="page-lead">
        {formatPrice(PACK_PRICE_PENCE)} each, yours to keep. Rounds of 7 from the pack, new
        questions first. Just for fun: no Top Kitties, no coins.
      </p>
      <PackShelf onPlay={setPlaying} />
    </section>
  );
}
