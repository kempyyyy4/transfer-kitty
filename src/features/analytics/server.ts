import "server-only";
import { ANALYTICS } from "@/config/analytics";
import { deleteOldAnalytics, getAnalyticsReport } from "@/lib/db";

// Server-only parts of analytics, for route handlers and the nightly job.
export * from "./schemas";
export { identifyVisitor, recordEvents, type RequestFacts } from "./service";

export const analyticsReport = getAnalyticsReport;

/** Deletes raw events past the keeping period. For the nightly job. */
export const clearOldAnalytics = (today: string) => deleteOldAnalytics(today, ANALYTICS.keepDays);
