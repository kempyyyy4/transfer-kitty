"use client";

import { track } from "@/features/analytics";
import { useState, type FormEvent } from "react";
import { accountApi, AccountApiError } from "../api-client";

const messageOf = (failure: unknown, fallback: string) =>
  failure instanceof AccountApiError ? failure.message : fallback;

/** Emailed code or Google. A guest's games and leagues come with them. */
export function SignInPanel({ isGuest }: { isGuest: boolean }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(event: FormEvent) {
    event.preventDefault();
    track("sign_in_started", { method: "email" });
    setError(null);
    setBusy(true);
    try {
      await accountApi.emailCode(email);
      setSentTo(email);
    } catch (failure) {
      setError(messageOf(failure, "Could not send the email."));
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <CodeForm
        email={sentTo}
        onChangeEmail={() => {
          setSentTo(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="page-lead">
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
          className="pixel-input p-3"
        />
        <button
          type="submit"
          disabled={busy}
          className="pixel-button border-floodlight px-4 py-3 text-xs text-floodlight"
        >
          {busy ? "SENDING..." : "EMAIL ME A CODE"}
        </button>
      </form>

      <p className="text-center text-sm text-chalk-dim">or</p>
      <a
        href={accountApi.googleSignInPath}
        onClick={() => track("sign_in_started", { method: "google" })}
        className="pixel-button px-4 py-3 text-xs"
      >
        SIGN IN WITH GOOGLE
      </a>

      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}

/** The code from the email is typed here, so it works whichever app the email is read in. */
function CodeForm({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { next } = await accountApi.verifyCode(email, code);
      window.location.assign(next);
    } catch (failure) {
      setError(messageOf(failure, "That did not work. Try again."));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={verify} className="pixel-panel flex flex-col gap-3 border-floodlight p-4">
      <p className="font-bold">Check your email</p>
      <p>We sent a sign-in code to {email}. It lasts an hour.</p>
      <label htmlFor="code">Your code</label>
      <input
        id="code"
        required
        autoFocus
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={10}
        className="pixel-input p-3 text-center text-2xl tracking-widest"
      />
      <button
        type="submit"
        disabled={busy || code.length < 6}
        className="pixel-button border-floodlight px-4 py-3 text-xs text-floodlight disabled:opacity-50"
      >
        {busy ? "CHECKING..." : "SIGN IN"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      <button type="button" onClick={onChangeEmail} className="text-center underline">
        Use a different email or send a new code
      </button>
    </form>
  );
}
