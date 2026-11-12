import type { z } from "zod";

/** A JSON error reply. The message is shown to players, so keep it plain. */
export function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

export const tooManyRequests = () => jsonError(429, "Too many requests. Wait a moment.");
export const notSignedIn = () => jsonError(401, "Start a game first.");
export const notFound = () => jsonError(404, "That game was not found.");

/**
 * Reads a request's JSON body and checks it against a schema.
 * Returns the checked value, or a 400 reply to send straight back.
 */
export async function readJsonBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<{ data: z.infer<Schema> } | { reply: Response }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { reply: jsonError(400, "The request was not valid JSON.") };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return { reply: jsonError(400, "The request was not valid.") };
  return { data: parsed.data };
}
