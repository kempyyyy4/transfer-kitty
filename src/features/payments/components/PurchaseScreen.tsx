"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { paymentsApi } from "../api-client";

/** Stripe's webhook usually lands within seconds; keep checking for this long. */
const CHECK_EVERY_MS = 2000;
const GIVE_UP_AFTER = 30;

type State = "checking" | "paid" | "slow" | "missing";

/** Where Stripe sends the player back to. Waits for the webhook to confirm payment. */
export function PurchaseScreen() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      const timer = setTimeout(() => setState("missing"), 0);
      return () => clearTimeout(timer);
    }
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      paymentsApi
        .purchase(id)
        .then(({ status }) => {
          if (status === "paid") {
            clearInterval(timer);
            setState("paid");
          } else if (tries >= GIVE_UP_AFTER) {
            clearInterval(timer);
            setState("slow");
          }
        })
        .catch(() => {
          clearInterval(timer);
          setState("missing");
        });
    }, CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-pixel text-lg leading-relaxed text-floodlight">THANK YOU</h1>
      {state === "checking" ? (
        <>
          <p className="text-xl">Confirming your payment with Stripe...</p>
          <Loader />
        </>
      ) : null}
      {state === "paid" ? (
        <p className="pixel-panel border-floodlight p-3 text-xl">
          All done. It is on your account, and comes back whenever you sign in.
        </p>
      ) : null}
      {state === "slow" ? (
        <p className="pixel-panel p-3 text-xl">
          Stripe is taking a while to confirm. It will appear on your account shortly; there is no
          need to pay again.
        </p>
      ) : null}
      {state === "missing" ? (
        <p className="pixel-panel p-3 text-xl">That purchase could not be found on this account.</p>
      ) : null}
      <Link href="/" className="pixel-button px-4 py-3 text-xs">
        BACK TO HOME
      </Link>
    </section>
  );
}
