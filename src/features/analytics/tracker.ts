"use client";

import type { AnalyticsEventName } from "@/config/analytics";

/**
 * The browser half of analytics. It keeps everything in memory for the open page only:
 * no cookies, no local storage, nothing that outlives the tab. Events go to /api/pulse.
 */

const ENDPOINT = "/api/pulse";

interface PageState {
  id: string;
  url: string;
  /** Time spent with the page visible, banked so far. */
  engagedMs: number;
  /** When the page last became visible, or null while hidden. */
  visibleSince: number | null;
}

let page: PageState | null = null;
let firstView = true;
let listening = false;

type Props = Record<string, string | number | boolean>;

/** Sends one event about the page at `url`: the current one unless said otherwise. */
function send(name: AnalyticsEventName, extra: Record<string, unknown> = {}, url?: string): void {
  if (typeof window === "undefined") return;
  const about = url ?? window.location.href;
  if (new URL(about).pathname.startsWith("/admin")) return;
  const body = JSON.stringify({ events: [{ name, url: about, pageviewId: page?.id, ...extra }] });
  // A beacon survives the page closing; fetch with keepalive is the fallback.
  if (!navigator.sendBeacon?.(ENDPOINT, body)) {
    void fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => undefined);
  }
}

/** A random ID for one page view, made without crypto.randomUUID, which needs HTTPS. */
function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function bankVisibleTime(): void {
  if (page?.visibleSince != null) {
    page.engagedMs += performance.now() - page.visibleSince;
    page.visibleSince = null;
  }
}

/** Sends the running total of time the current page has been looked at. */
function flushEngagement(): void {
  if (!page) return;
  bankVisibleTime();
  // Labelled with the page it measured: on a move between pages the address has already changed.
  if (page.engagedMs >= 1000) {
    send("engagement", { engagedMs: Math.round(page.engagedMs) }, page.url);
  }
  if (document.visibilityState === "visible") page.visibleSince = performance.now();
}

function listen(): void {
  if (listening) return;
  listening = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushEngagement();
    else if (page) page.visibleSince = performance.now();
  });
  window.addEventListener("pagehide", flushEngagement);
}

/** Records a page view. Called on every navigation, including the first load. */
export function trackPageview(): void {
  if (page?.url === window.location.href) return;
  listen();
  flushEngagement();
  page = {
    id: randomId(),
    url: window.location.href,
    engagedMs: 0,
    visibleSince: document.visibilityState === "visible" ? performance.now() : null,
  };
  send("pageview", {
    // Only the first page of a visit has an outside referrer worth keeping.
    referrer: firstView ? document.referrer || undefined : undefined,
    screenWidth: window.screen.width,
  });
  firstView = false;
}

/** Records a named event, such as a share. Props are short labels, never personal data. */
export function track(name: Exclude<AnalyticsEventName, "pageview" | "engagement">, props?: Props) {
  send(name, props ? { props } : {});
}
