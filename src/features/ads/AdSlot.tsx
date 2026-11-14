"use client";

import { useEffect, useRef, useState } from "react";
import { useAccess } from "@/features/payments";
import { getPublicEnv } from "@/lib/env";
import { hasAdConsent } from "./consent";

const SCRIPT_ID = "adsbygoogle-script";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * One AdSense ad, for free players only, on the Results and Top Kitties screens, never
 * mid-game. Nothing loads unless AdSense is set up, the player has agreed to ads, and they
 * have not bought the lifetime unlock.
 */
export function AdSlot() {
  const access = useAccess();
  const [consented, setConsented] = useState(false);
  const client = getPublicEnv().adsenseClient;
  const pushed = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setConsented(hasAdConsent()), 0);
    return () => clearTimeout(timer);
  }, []);

  const show = Boolean(client) && consented && access !== null && !access.lifetime;

  useEffect(() => {
    if (!show || !client || pushed.current) return;
    pushed.current = true;
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      document.head.appendChild(script);
    }
    (window.adsbygoogle = window.adsbygoogle ?? []).push({});
  }, [show, client]);

  if (!show || !client) return null;
  return (
    <aside aria-label="Advert" className="flex flex-col items-center gap-1">
      <span className="font-pixel text-[8px] text-chalk-dim">ADVERT</span>
      <ins
        className="adsbygoogle block w-full"
        data-ad-client={client}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
