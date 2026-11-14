"use client";

import { useState } from "react";
import { paymentsApi, PaymentsApiError } from "../api-client";

interface Props {
  /** "lifetime", a coin pack ID, or "pack:<id>". The server looks up the price. */
  product: string;
  label: string;
}

/** Sends the player to Stripe Checkout. Card details are typed on Stripe's page, never here. */
export function BuyButton({ product, label }: Props) {
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
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void buy()}
        className="pixel-button border-floodlight px-3 py-2 text-[10px] text-floodlight"
      >
        {busy ? "OPENING..." : label}
      </button>
      {message ? (
        <p role="status" className="text-center text-claret">
          {message}
        </p>
      ) : null}
    </div>
  );
}
