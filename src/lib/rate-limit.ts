import "server-only";
import type { RateLimitRule } from "@/config/rate-limits";
import { consumeRateLimit } from "@/lib/db";

/**
 * Counts a request by `subject` (a user ID) against a rule from src/config/rate-limits.ts.
 * Returns false when they have gone over. The counter lives in Postgres; swapping it for
 * Redis later means changing only this function.
 */
export function isWithinRateLimit(rule: RateLimitRule, subject: string): Promise<boolean> {
  return consumeRateLimit(`${rule.name}:${subject}`, rule.limit, rule.windowSeconds);
}
