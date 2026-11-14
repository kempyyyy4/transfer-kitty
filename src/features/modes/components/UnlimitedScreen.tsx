"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader } from "@/components/Loader";
import { GameScreen } from "@/features/game";
import { LifetimeCard, useAccess } from "@/features/payments";

/** Endless rounds of 7 from the question bank, for lifetime players. */
export function UnlimitedScreen() {
  const access = useAccess();
  const [playing, setPlaying] = useState(false);

  if (playing) return <GameScreen round={{ mode: "unlimited" }} />;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-pixel text-lg leading-relaxed text-floodlight">UNLIMITED</h1>
      <p className="text-xl">
        Round after round of 7, from the whole question bank. Questions you have not seen come
        first. Just for fun: no Top Kitties, no coins.
      </p>
      {access === null ? <Loader /> : null}
      {access?.lifetime ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="pixel-button border-floodlight px-6 py-5 text-xl text-floodlight"
        >
          KICK OFF
        </button>
      ) : null}
      {access && !access.lifetime ? <LifetimeCard /> : null}
      <Link href="/" className="pixel-button px-4 py-3 text-xs">
        BACK TO HOME
      </Link>
    </section>
  );
}
