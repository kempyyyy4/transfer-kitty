"use client";

import { useState } from "react";
import { paymentsApi, PaymentsApiError } from "../api-client";

interface Props {
  /** "lifetime", a coin pack ID, or "pack:<id>". The server looks up the price. */
  product: string;
  label: string;
  /** A full-width, larger button, for the main offer on a card. */
  wide?: boolean;
}

/** Sends the player to Stripe Checkout. Card details are typed on Stripe's page, never here. */
export function BuyButton({ product, label, wide = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function buy() {
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
        disabled={busy}
        onClick={() => void buy()}
        className={`pixel-button border-floodlight ${
          wide
            ? "w-full bg-floodlight px-4 py-3 text-xs text-night-deep hover:text-night-deep"
            : "px-3 py-2 text-[10px] text-floodlight"
        }`}
      >
        {busy ? "OPENING..." : label}
      </button>
      <p className={`text-center text-base text-chalk-dim ${wide ? "" : "max-w-56"}`}>
        Starts straight away, so you give up the 14-day right to cancel.{" "}
        <a href="/terms" className="underline">
          Terms
        </a>
      </p>
      {message ? (
        <p role="status" className="text-center text-claret">
          {message}
        </p>
      ) : null}
    </div>
  );
}
