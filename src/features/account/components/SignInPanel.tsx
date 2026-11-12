"use client";

import { useState, type FormEvent } from "react";
import { accountApi, AccountApiError } from "../api-client";

/** Email link or Google. A guest's games and leagues come with them. */
export function SignInPanel({ isGuest }: { isGuest: boolean }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await accountApi.emailLink(email);
      setSentTo(email);
    } catch (failure) {
      setError(failure instanceof AccountApiError ? failure.message : "Could not send the email.");
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-2 border-2 border-amber-400 p-4" role="status">
        <p className="font-bold">Check your email</p>
        <p>
          We sent a sign-in link to {sentTo}. Open it on this device, in this browser, within the
          hour.
        </p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <p>
        Sign in to appear on Top Kitties under your own name and keep your kitty on every device.
        {isGuest ? " Everything you have played so far comes with you." : ""}
      </p>

      <form onSubmit={send} className="flex flex-col gap-2">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="border-2 border-slate-100 bg-slate-900 p-3"
        />
        <button type="submit" className="border-2 border-amber-400 p-3 font-bold">
          Email me a sign-in link
        </button>
      </form>

      <p className="text-center text-sm text-slate-400">or</p>
      <a
        href={accountApi.googleSignInPath}
        className="border-2 border-slate-100 p-3 text-center font-bold"
      >
        Sign in with Google
      </a>

      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
