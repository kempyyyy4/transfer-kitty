"use client";

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
  description: "Endless rounds of 7, whenever you like. No waiting for tomorrow.",
  art: "ball",
};

const TILES: readonly Tile[] = [
  {
    href: "/top-kitties",
    title: "TOP KITTIES",
    description: "Create leagues with your friends and see how you match up.",
    art: "trophy",
  },
  {
    href: "/profile",
    title: "PROFILE",
    description: "Build your cat, guard your streak, see every kitty.",
    art: "kit",
  },
  {
    href: "/shop",
    title: "SHOP",
    description: "Today's kits and gear, plus themed packs.",
    art: "shirt",
  },
  {
    href: "/archive",
    title: "ARCHIVE",
    description: "Replay any day's puzzle you missed.",
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
        onClick={() => setOpen(!open)}
        className="pixel-button fixed top-3 left-3 z-50 flex h-10 w-12 flex-col items-center justify-center gap-1"
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
          className="animate-menu-in fixed inset-0 z-40 flex flex-col overflow-y-auto bg-night-deep/95 px-4 pt-16 pb-6"
        >
          <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
            <Link
              href="/"
              onClick={close}
              className="pixel-button flex items-center justify-center gap-3 px-4 py-2 text-xs"
            >
              <HomeIcon />
              HOME
            </Link>
            <MenuTile tile={FEATURED} featured onPick={close} />
            <div className="grid grid-cols-2 gap-3">
              {TILES.map((tile) => (
                <MenuTile key={tile.href} tile={tile} onPick={close} />
              ))}
            </div>
            <div className="flex justify-center pt-2 font-pixel text-[10px]">
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
      className={`pixel-button relative flex flex-col justify-end overflow-hidden p-3 text-left ${
        featured
          ? "min-h-36 border-floodlight bg-floodlight text-night-deep hover:text-night-deep"
          : "min-h-32"
      }`}
    >
      <MenuArt
        kind={tile.art}
        className={`absolute -top-2 -right-2 h-24 w-24 ${featured ? "opacity-40" : "opacity-25"}`}
      />
      <span className={`relative font-pixel ${featured ? "text-xl" : "text-xs"}`}>
        {tile.title}
      </span>
      <span
        className={`relative mt-1 font-mono leading-tight ${
          featured ? "text-xl text-night-deep" : "text-lg text-chalk-dim"
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
