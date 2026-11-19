"use client";

import { track } from "@/features/analytics";
import { useId, useState } from "react";
import { paymentsApi, PaymentsApiError } from "../api-client";

interface Props {
  /** "lifetime", a coin pack ID, or "pack:<id>". The server looks up the price. */
  product: string;
  label: string;
  /** A full-width, larger button, for the main offer on a card. */
  wide?: boolean;
}

/**
 * Sends the player to Stripe Checkout. Card details are typed on Stripe's page, never here.
 * The player must first tick that it starts straight away and they lose the 14-day right to
 * cancel: UK law needs that express agreement for digital content (Consumer Contracts
 * Regulations 2013, regulation 37), and a notice alone is not enough.
 */
export function BuyButton({ product, label, wide = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const agreeId = useId();

  async function buy() {
    track("buy_clicked", { product: product.startsWith("pack:") ? "pack" : product });
    setBusy(true);
    setMessage(null);
    try {
      const { url } = await paymentsApi.checkout(product);
      window.location.assign(url);
    } catch (failure) {
      setMessage(failure instanceof PaymentsApiError ? failure.message : "That did not work.");
      setBusy(false);
    }
  }

  return (
    <div className={`flex flex-col items-center gap-1 ${wide ? "w-full" : ""}`}>
      <button
        type="button"
        disabled={busy || !agreed}
        onClick={() => void buy()}
        className={`pixel-button border-floodlight ${
          wide
            ? "w-full bg-floodlight px-4 py-3 text-xs text-night-deep hover:text-night-deep"
            : "px-3 py-2 text-[10px] text-floodlight"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {busy ? "OPENING..." : label}
      </button>
      <label
        htmlFor={agreeId}
        className={`order-first flex cursor-pointer items-start gap-2 text-left text-base leading-tight text-chalk-dim ${wide ? "" : "max-w-60"}`}
      >
        <input
          id={agreeId}
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-floodlight"
        />
        <span>
          Start it straight away. I understand I then lose my 14-day right to cancel.{" "}
          <a href="/terms" className="underline">
            Terms
          </a>
        </span>
      </label>
      {message ? (
        <p role="status" className="text-center text-claret">
          {message}
        </p>
      ) : null}
    </div>
  );
}
