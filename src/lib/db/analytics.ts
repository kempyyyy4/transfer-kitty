import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

/** One analytics event as stored. Only coarse, derived facts: see the analytics migration. */
export interface AnalyticsRow {
  day: string;
  name: string;
  visitor: string;
  pageview_id: string | null;
  path: string;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  country: string | null;
  device: "phone" | "tablet" | "desktop";
  browser: string;
  os: string;
  engaged_ms: number | null;
  props: Record<string, string | number | boolean> | null;
}

/** The salt for a UK day. A day's salt is deleted the day after next, so hashes can't be linked. */
export async function getAnalyticsSalt(day: string): Promise<string> {
  const { data, error } = await getServiceClient().rpc("analytics_salt", { p_day: day });
  if (error) throw new Error(`Reading the analytics salt failed: ${error.message}`);
  return z.string().min(32).parse(data);
}

export async function insertAnalyticsEvents(rows: readonly AnalyticsRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await getServiceClient().from("analytics_events").insert(rows);
  if (error) throw new Error(`Saving analytics failed: ${error.message}`);
}

/** Deletes events older than `keepDays`. Returns how many went. */
export async function deleteOldAnalytics(today: string, keepDays: number): Promise<number> {
  const { data, error } = await getServiceClient().rpc("analytics_cleanup", {
    p_today: today,
    p_keep_days: keepDays,
  });
  if (error) throw new Error(`Clearing old analytics failed: ${error.message}`);
  return z.number().parse(data);
}

const count = z.coerce.number();
const nullableNumber = z.coerce.number().nullable();
const topRow = z.object({ key: z.string(), views: count, visitors: count });
const visitRow = z.object({ key: z.string(), visits: count });

export const analyticsReportSchema = z.object({
  from: z.string(),
  to: z.string(),
  traffic: z.object({
    visitors: count,
    pageviews: count,
    visits: count,
    bounceRate: nullableNumber,
    pagesPerVisit: nullableNumber,
    avgVisitMs: nullableNumber,
    avgEngagementPerVisitorMs: nullableNumber,
  }),
  daily: z.array(
    z.object({
      day: z.string(),
      visitors: count,
      pageviews: count,
      engagedMs: count,
      accounts: count,
      guests: count,
      roundsStarted: count,
      roundsCompleted: count,
      players: count,
      revenuePence: count,
    }),
  ),
  pages: z.array(topRow),
  referrers: z.array(topRow),
  utmSources: z.array(topRow),
  utmCampaigns: z.array(topRow),
  countries: z.array(topRow),
  devices: z.array(topRow),
  browsers: z.array(topRow),
  systems: z.array(topRow),
  entryPages: z.array(visitRow),
  exitPages: z.array(visitRow),
  pageEngagement: z.array(z.object({ key: z.string(), avgMs: count, views: count })),
  hours: z.array(count),
  events: z.array(z.object({ key: z.string(), count: count, visitors: count })),
  game: z.object({
    byMode: z.array(
      z.object({
        mode: z.string(),
        started: count,
        completed: count,
        avgKitty: nullableNumber,
        players: count,
      }),
    ),
    tiers: z.array(z.object({ tier: count, count: count })),
    outcomes: z.array(z.object({ outcome: z.string(), count: count })),
    avgAnswerMs: nullableNumber,
    activePlayers: count,
    newPlayers: count,
    returningPlayers: count,
    retention: z.object({ cohort: count, day1: count, day7: count }),
  }),
  accounts: z.object({
    newAccounts: count,
    newGuests: count,
    totalAccounts: count,
    totalGuests: count,
    profiles: count,
  }),
  money: z.object({
    revenuePence: count,
    purchases: count,
    checkoutsStarted: count,
    byProduct: z.array(z.object({ key: z.string(), count: count, pence: count })),
    coinsEarned: count,
    coinsSpent: count,
  }),
  social: z.object({ leaguesCreated: count, leagueJoins: count, reports: count }),
});

export type AnalyticsReport = z.infer<typeof analyticsReportSchema>;

/** Everything the analytics dashboard shows for the UK days `from` to `to`. */
export async function getAnalyticsReport(from: string, to: string): Promise<AnalyticsReport> {
  const { data, error } = await getServiceClient().rpc("admin_analytics", {
    p_from: from,
    p_to: to,
  });
  if (error) throw new Error(`Reading analytics failed: ${error.message}`);
  return analyticsReportSchema.parse(data);
}
