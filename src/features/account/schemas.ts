import { z } from "zod";

export const emailSignInSchema = z.object({ email: z.email().max(254) });

/** Supabase codes are 6 to 10 digits, depending on the project's setting. */
export const emailCodeSchema = z.object({
  email: z.email().max(254),
  code: z.string().regex(/^\d{6,10}$/),
});

/** The player types DELETE to confirm, so a stray click can never delete an account. */
export const deleteAccountSchema = z.object({ confirm: z.literal("DELETE") });

export const displayNameSchema = z.object({ name: z.string().max(100) });

export const callbackQuerySchema = z.object({
  code: z.string().min(1).nullable(),
  token_hash: z.string().min(1).nullable(),
  type: z.enum(["magiclink", "email", "signup", "invite", "recovery", "email_change"]).nullable(),
});

export type CallbackQuery = z.infer<typeof callbackQuerySchema>;
