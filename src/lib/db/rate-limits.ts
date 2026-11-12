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
