"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageview } from "./tracker";

/** Sends a page view on the first load and on every move between pages. Draws nothing. */
export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    trackPageview();
  }, [pathname]);
  return null;
}
