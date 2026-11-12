import type { AccountStatus } from "./types";

/** An error the server explained, with a message fit to show the player. */
export class AccountApiError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : "Something went wrong. Try again.";
    throw new AccountApiError(message);
  }
  return (await response.json()) as T;
}

function post<T>(path: string, body: object = {}): Promise<T> {
  return call<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const accountApi = {
  status: () => call<AccountStatus>("/api/account"),
  emailLink: (email: string) => post<{ sent: true }>("/api/auth/email", { email }),
  setName: (name: string) => post<{ displayName: string }>("/api/account/name", { name }),
  signOut: () => post<{ signedOut: true }>("/api/auth/sign-out"),
  /** A page, not an API call: the browser goes there and on to Google. */
  googleSignInPath: "/api/auth/google",
};
