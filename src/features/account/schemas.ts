import { z } from "zod";

export const emailSignInSchema = z.object({ email: z.email().max(254) });

export const displayNameSchema = z.object({ name: z.string().max(100) });

export const callbackQuerySchema = z.object({
  code: z.string().min(1).nullable(),
  token_hash: z.string().min(1).nullable(),
  type: z.enum(["magiclink", "email", "signup", "invite", "recovery", "email_change"]).nullable(),
});

export type CallbackQuery = z.infer<typeof callbackQuerySchema>;
