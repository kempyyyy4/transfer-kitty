import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

/**
 * A Supabase client that reads and writes the visitor's session in cookies.
 * It uses the publishable key, so it can only do what the visitor is allowed to.
 */
async function createSessionClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

/**
 * The current visitor's user ID, or null if they have no session.
 * The session token's signature is checked: a forged cookie gets null.
 */
export async function getUserId(): Promise<string | null> {
  const client = await createSessionClient();
  const { data } = await client.auth.getClaims();
  return data?.claims.sub ?? null;
}

/**
 * The current visitor's user ID, signing them in as a guest if they have no session.
 * A guest is a real user with no email, so everything they do carries over if they sign
 * up later. Call this only from a route handler, where cookies can be written.
 */
export async function getOrCreateUserId(): Promise<string> {
  const client = await createSessionClient();
  const { data: existing } = await client.auth.getClaims();
  if (existing?.claims.sub) return existing.claims.sub;

  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(`Guest sign-in failed: ${error?.message ?? "no user returned"}`);
  }
  return data.user.id;
}
