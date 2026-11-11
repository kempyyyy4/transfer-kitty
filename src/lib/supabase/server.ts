import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

let serviceClient: SupabaseClient | undefined;

/**
 * Client for server code. It uses the secret key, which bypasses row-level
 * security, so it must never be reachable from the browser.
 */
export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const env = getServerEnv();
    serviceClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}
