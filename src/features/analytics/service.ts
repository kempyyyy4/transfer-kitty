import "server-only";
import { createHash } from "node:crypto";
import { ANALYTICS } from "@/config/analytics";
import { getAnalyticsSalt, insertAnalyticsEvents, type AnalyticsRow } from "@/lib/db";
import { ukDayOf } from "@/lib/time/uk-day";
import type { IncomingEvent } from "./schemas";
import { deviceFacts, isBot } from "./user-agent";

/** What the server knows about the request itself, beyond the events it carries. */
export interface RequestFacts {
  address: string;
  userAgent: string;
  /** Two-letter country from the host's geo header, if any. */
  country: string | null;
  /** This site's own host, so internal links are not counted as referrers. */
  host: string;
}

let cachedSalt: { day: string; salt: string } | null = null;

async function saltFor(day: string): Promise<string> {
  if (cachedSalt?.day !== day) cachedSalt = { day, salt: await getAnalyticsSalt(day) };
  return cachedSalt.salt;
}

/**
 * A visitor's ID for one UK day only: a hash of the day's secret salt, their address and
 * browser. The salt is deleted after a day, so the hash cannot be reversed or matched to
 * any other day. Nothing is stored on the visitor's device.
 */
export function visitorHash(salt: string, facts: RequestFacts): string {
  return createHash("sha256")
    .update(`${salt}|${facts.host}|${facts.address}|${facts.userAgent}`)
    .digest("hex")
    .slice(0, 16);
}

/** Today's UK day and the visitor's hash for it, or null for a bot, which is never counted. */
export async function identifyVisitor(
  facts: RequestFacts,
): Promise<{ day: string; visitor: string } | null> {
  if (isBot(facts.userAgent)) return null;
  const day = ukDayOf(new Date());
  return { day, visitor: visitorHash(await saltFor(day), facts) };
}

/** Turns a batch of browser events into rows of coarse facts and saves them. */
export async function recordEvents(
  who: { day: string; visitor: string },
  facts: RequestFacts,
  events: readonly IncomingEvent[],
): Promise<void> {
  const { day, visitor } = who;
  const device = deviceFacts(facts.userAgent);

  const rows: AnalyticsRow[] = events.map((event) => {
    const page = parsePage(event.url);
    return {
      day,
      name: event.name,
      visitor,
      pageview_id: event.pageviewId ?? null,
      path: page.path,
      referrer_host: referrerHost(event.referrer, facts.host),
      utm_source: page.utm.source,
      utm_medium: page.utm.medium,
      utm_campaign: page.utm.campaign,
      country: facts.country,
      device: event.screenWidth ? deviceFromWidth(event.screenWidth, device.device) : device.device,
      browser: device.browser,
      os: device.os,
      engaged_ms: event.engagedMs ?? null,
      props: event.props ?? null,
    };
  });
  await insertAnalyticsEvents(rows.slice(0, ANALYTICS.maxBatch));
}

/** The page's path without its query string, plus any campaign tags it carried. */
export function parsePage(url: string): {
  path: string;
  utm: { source: string | null; medium: string | null; campaign: string | null };
} {
  let parsed: URL;
  try {
    parsed = new URL(url, "https://site.invalid");
  } catch {
    return { path: "/", utm: { source: null, medium: null, campaign: null } };
  }
  const tag = (name: string) => parsed.searchParams.get(name)?.slice(0, 60).toLowerCase() || null;
  return {
    // IDs in paths would make every page unique, so long hex or number segments become ":id".
    path: parsed.pathname.replace(/\/(?:[0-9a-f-]{8,}|\d+)(?=\/|$)/gi, "/:id").slice(0, 200) || "/",
    utm: {
      source: tag("utm_source") ?? tag("ref"),
      medium: tag("utm_medium"),
      campaign: tag("utm_campaign"),
    },
  };
}

/** Where the visitor came from, as a bare host. Null for direct visits and our own pages. */
export function referrerHost(referrer: string | undefined, ownHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    return host === ownHost.replace(/^www\./, "").toLowerCase() ? null : host.slice(0, 100);
  } catch {
    return null;
  }
}

/** The screen width settles phone versus tablet better than the user-agent string can. */
function deviceFromWidth(width: number, fromAgent: AnalyticsRow["device"]): AnalyticsRow["device"] {
  if (fromAgent === "desktop" && width >= 1024) return "desktop";
  if (width < 600) return "phone";
  if (width < 1024) return "tablet";
  return fromAgent;
}
