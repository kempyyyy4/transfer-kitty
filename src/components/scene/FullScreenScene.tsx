"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const noSubscription = () => () => {};

/**
 * A screen that replaces everything else: drawn straight onto the page body, above the
 * stadium, menu-page column and footer, whatever wraps it. Rendering in place would not
 * do: a page's opening animation boxes in fixed layers and lets the stadium show beside
 * them on a wide screen.
 */
export function FullScreenScene({ children }: { children: ReactNode }) {
  const inBrowser = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  if (!inBrowser) return null;
  return createPortal(
    <div className="fixed inset-0 z-30 overflow-hidden bg-night-deep">{children}</div>,
    document.body,
  );
}
