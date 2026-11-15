"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "HOME" },
  { href: "/top-kitties", label: "TOP KITTIES" },
  { href: "/profile", label: "PROFILE" },
  { href: "/shop", label: "SHOP" },
  { href: "/archive", label: "ARCHIVE" },
  { href: "/packs", label: "THEMED PACKS" },
  { href: "/unlimited", label: "UNLIMITED" },
  { href: "/account", label: "ACCOUNT" },
] as const;

/** The three-line menu button in the top left, opening every screen in the game. */
export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

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
          <span key={bar} className="block h-1 w-6 bg-current" />
        ))}
      </button>

      {open ? (
        <nav
          aria-label="Menu"
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-night-deep/95 px-6"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
              className="pixel-button w-full max-w-xs px-4 py-3 text-center text-xs"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}
