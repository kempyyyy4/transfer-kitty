"use client";

import { track } from "@/features/analytics";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MenuArt, type MenuArtKind } from "./MenuArt";

interface Tile {
  href: string;
  title: string;
  description: string;
  art: MenuArtKind;
}

/** Unlimited leads the menu, full width and lit up: it is what the unlock is for. */
const FEATURED: Tile = {
  href: "/unlimited",
  title: "UNLIMITED",
  description: "Endless rounds of 7, whenever you like.",
  art: "ball",
};

const TILES: readonly Tile[] = [
  {
    href: "/top-kitties",
    title: "TOP KITTIES",
    description: "Create leagues with friends. See how you match up.",
    art: "trophy",
  },
  {
    href: "/profile",
    title: "PROFILE",
    description: "Your cat, your streak, every kitty.",
    art: "kit",
  },
  {
    href: "/shop",
    title: "SHOP",
    description: "New kits every day, plus packs.",
    art: "shirt",
  },
  {
    href: "/archive",
    title: "ARCHIVE",
    description: "Replay any day you missed.",
    art: "calendar",
  },
];

/** The three-line button, top left, opening a menu of big tiles for every part of the game. */
export function SiteMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close the menu" : "Open the menu"}
        aria-expanded={open}
        onClick={() => {
          if (!open) track("menu_open");
          setOpen(!open);
        }}
        className="pixel-button fixed top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-50 flex h-10 w-12 flex-col items-center justify-center gap-1"
      >
        {[0, 1, 2].map((bar) => (
          <span
            key={bar}
            className={`block h-1 w-6 bg-current transition-all duration-200 ${
              open && bar === 0 ? "translate-y-2 rotate-45" : ""
            } ${open && bar === 2 ? "-translate-y-2 -rotate-45" : ""} ${
              open && bar === 1 ? "opacity-0" : ""
            }`}
          />
        ))}
      </button>

      {open ? (
        <nav
          aria-label="Menu"
          className="animate-menu-in fixed inset-0 z-40 flex h-[100dvh] flex-col bg-night-deep/95 px-3 pt-16 pb-3"
        >
          {/* Everything in one column of equal width, filling the screen below the top buttons. */}
          <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col gap-3">
            <MenuTile tile={FEATURED} featured onPick={close} />
            <div className="grid min-h-0 flex-[2] grid-cols-2 grid-rows-2 gap-3">
              {TILES.map((tile) => (
                <MenuTile key={tile.href} tile={tile} onPick={close} />
              ))}
            </div>
            <Link
              href="/"
              onClick={close}
              className="pixel-button flex w-full shrink-0 items-center justify-center gap-3 py-3 text-xs"
            >
              <HomeIcon />
              HOME
            </Link>
            <div className="flex shrink-0 justify-center font-pixel text-[10px]">
              <Link href="/account" onClick={close} className="text-chalk-dim hover:text-chalk">
                ACCOUNT
              </Link>
            </div>
          </div>
        </nav>
      ) : null}
    </>
  );
}

function MenuTile({
  tile,
  featured = false,
  onPick,
}: {
  tile: Tile;
  featured?: boolean;
  onPick: () => void;
}) {
  return (
    <Link
      href={tile.href}
      onClick={onPick}
      className={`pixel-button relative flex flex-col justify-start overflow-hidden p-3 text-left ${
        featured
          ? "min-h-0 flex-1 border-floodlight bg-floodlight text-night-deep hover:text-night-deep"
          : "min-h-0"
      }`}
    >
      {featured ? (
        // The feature tile's ball does keepy-ups, in full colour, clear of the words.
        <MenuArt
          kind={tile.art}
          className="animate-ball-bob absolute top-1/2 right-4 aspect-square h-[min(5.5rem,40%)] w-auto -translate-y-1/2 drop-shadow-[4px_4px_0_rgb(0_0_0/0.35)]"
        />
      ) : (
        <MenuArt
          kind={tile.art}
          className="absolute -right-2 -bottom-2 aspect-square h-[min(5rem,60%)] w-auto opacity-30"
        />
      )}
      <span className={`relative font-pixel ${featured ? "pr-24 text-xl" : "text-xs"}`}>
        {tile.title}
      </span>
      <span
        className={`relative mt-1 font-mono leading-tight ${
          featured ? "pr-24 text-xl text-night-deep" : "text-lg text-chalk-dim"
        }`}
      >
        {tile.description}
      </span>
    </Link>
  );
}

/** A small pixel house. */
function HomeIcon() {
  return (
    <svg viewBox="0 0 7 7" width={14} height={14} shapeRendering="crispEdges" aria-hidden>
      <rect x={3} y={0} width={1} height={1} fill="currentColor" />
      <rect x={2} y={1} width={3} height={1} fill="currentColor" />
      <rect x={1} y={2} width={5} height={1} fill="currentColor" />
      <rect x={0} y={3} width={7} height={1} fill="currentColor" />
      <rect x={1} y={4} width={5} height={3} fill="currentColor" />
      <rect x={3} y={5} width={1} height={2} fill="var(--color-night-deep)" />
    </svg>
  );
}
