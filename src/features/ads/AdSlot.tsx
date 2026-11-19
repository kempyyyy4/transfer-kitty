"use client";

import { useEffect, useRef } from "react";
import { useAccess } from "@/features/payments";
import { getPublicEnv } from "@/lib/env";

const SCRIPT_ID = "adsbygoogle-script";

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: 0 | 1 };
  }
}

/**
 * One AdSense ad, for free players only, on the Results and Top Kitties screens, never
 * mid-game. Nothing loads unless AdSense is set up and the player has no lifetime unlock.
 * Consent is asked by Google's own certified message (AdSense, Privacy & messaging), which
 * the AdSense script shows to UK and EU visitors before any personalised ad.
 *
 * Ads are never personalised, for anyone (Tom's choice, 19 November 2026): football trivia
 * draws under-18s, and the ICO's Children's Code expects no personalised ads for them.
 * Google still asks consent for its ad cookies where the law needs it.
 */
export function AdSlot() {
  const access = useAccess();
  const client = getPublicEnv().adsenseClient;
  const pushed = useRef(false);

  const show = Boolean(client) && access !== null && !access.lifetime;

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
    const queue = (window.adsbygoogle = window.adsbygoogle ?? []);
    // Must be set before the first push (Google AdSense help, answer 9042142).
    queue.requestNonPersonalizedAds = 1;
    queue.push({});
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
