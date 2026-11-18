/**
 * First-party analytics. No cookies and nothing stored on the visitor's device, so the
 * site needs no consent banner for it. See src/features/analytics.
 */
export const ANALYTICS = {
  /** Raw events older than this are deleted by the nightly job. */
  keepDays: 400,
  /** Most events one request may carry. */
  maxBatch: 10,
  /** Ranges the dashboard offers, in days. */
  ranges: [1, 7, 30, 90, 365],
  /** Named events the browser may send, besides page views and engagement time. */
  events: [
    "share",
    "sign_in_started",
    "sound_on",
    "menu_open",
    "answers_viewed",
    "kick_skipped",
    "report_opened",
    "buy_clicked",
  ],
} as const;

export type AnalyticsEventName = "pageview" | "engagement" | (typeof ANALYTICS.events)[number];
