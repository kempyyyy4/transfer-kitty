import { z } from "zod";

/** An optional variable. Left blank in .env.local, it counts as not set. */
const optional = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  /** Proves a scheduled-job request came from Vercel. Without it the job refuses to run. */
  CRON_SECRET: optional(z.string().min(16)),
  /** The one account allowed into the admin area. Without it and the password, admin is off. */
  ADMIN_USER_ID: optional(z.uuid()),
  /** Asked for on the admin page, on top of being signed in as ADMIN_USER_ID. */
  ADMIN_PASSWORD: optional(z.string().min(16)),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing or invalid environment variables: ${names}. See .env.example.`);
  }
  return result.data;
}

let cachedEnv: ServerEnv | undefined;

/** Checked on first use, not at import, so tools that never touch the database still run. */
export function getServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv(process.env);
  return cachedEnv;
}
