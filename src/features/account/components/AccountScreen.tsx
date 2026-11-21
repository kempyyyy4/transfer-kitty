"use client";

import { Loader } from "@/components/Loader";
import { useEffect, useState } from "react";
import { accountApi } from "../api-client";
import type { AccountStatus } from "../types";
import { DeleteAccountPanel } from "./DeleteAccountPanel";
import { NamePanel } from "./NamePanel";
import { SignInPanel } from "./SignInPanel";

/** Sign in, choose a name, or sign out. */
export function AccountScreen() {
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    // The notice comes from the address, which only the browser knows, so it is read here.
    const fromAddress = noticeFromAddress(new URLSearchParams(window.location.search));
    accountApi
      .status()
      .catch((): AccountStatus => ({ status: "none" }))
      .then((loaded) => {
        setAccount(loaded);
        setNotice(fromAddress);
      });
  }, []);

  async function signOut() {
    await accountApi.signOut();
    setAccount({ status: "none" });
    setNotice("You are signed out.");
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="page-title">YOUR ACCOUNT</h1>
      {notice ? (
        <p role="status" className="pixel-panel border-floodlight p-3">
          {notice}
        </p>
      ) : null}

      {account === null ? <Loader /> : null}
      {account && account.status !== "signed_in" ? (
        <SignInPanel isGuest={account.status === "guest"} />
      ) : null}
      {account?.status === "signed_in" ? (
        <>
          <p>Signed in{account.email ? ` as ${account.email}` : ""}.</p>
          <NamePanel
            current={account.displayName}
            onSaved={(displayName) => setAccount({ ...account, displayName })}
          />
          <button
            type="button"
            onClick={() => void signOut()}
            className="pixel-button self-start px-3 py-2 text-[10px] hover:border-claret hover:text-claret"
          >
            SIGN OUT
          </button>
          <DeleteAccountPanel
            onDeleted={() => {
              setAccount({ status: "none" });
              setNotice("Your account has been deleted.");
            }}
          />
        </>
      ) : null}
    </section>
  );
}

/** What the sign-in return page reported, as a sentence for the player. */
function noticeFromAddress(params: URLSearchParams): string | null {
  if (params.get("signin") === "failed") {
    return "That sign-in did not work. Please try again below.";
  }
  if (params.get("signin") !== "ok") return null;

  const moved = Number(params.get("moved") ?? 0);
  const carried = moved > 0 ? ` ${moved} ${moved === 1 ? "game" : "games"} came with you.` : "";
  const name = params.get("name") === "needed" ? " Now choose your name for Top Kitties." : "";
  return `You are signed in.${carried}${name}`;
}
