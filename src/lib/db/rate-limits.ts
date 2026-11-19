import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

/** Counts one request against a limit. Returns false once the limit for this window is used up. */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await getServiceClient().rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error(`Rate limit check failed: ${error.message}`);

  return z.boolean().parse(data);
}

/**
 * Deletes request counters older than a day. Some keys hold an IP address (sign-in limits),
 * and the privacy policy says those are kept only briefly. Returns how many were removed.
 */
export async function deleteOldRateLimits(now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await getServiceClient()
    .from("rate_limits")
    .delete({ count: "exact" })
    .lt("window_start", cutoff);
  if (error) throw new Error(`Clearing old rate limits failed: ${error.message}`);
  return count ?? 0;
}
