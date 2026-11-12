"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { adminApi } from "../api-client";
import type { AdminAccessStatus } from "../types";
import { AdminTabs } from "./AdminTabs";
import { UnlockPanel } from "./UnlockPanel";

/** The admin area: closed to everyone but the admin account, after its password. */
export function AdminScreen() {
  const [access, setAccess] = useState<AdminAccessStatus | null>(null);

  useEffect(() => {
    adminApi
      .access()
      .catch((): AdminAccessStatus => ({ status: "not_admin", accountId: null }))
      .then(setAccess);
  }, []);

  async function lock() {
    await adminApi.lock();
    if (access?.accountId) setAccess({ status: "locked", accountId: access.accountId });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pr-14">
        <h1 className="font-pixel text-lg leading-relaxed text-floodlight">ADMIN</h1>
        {access?.status === "admin" ? (
          <button
            type="button"
            onClick={() => void lock()}
            className="pixel-button px-3 py-2 text-[10px]"
          >
            LOCK
          </button>
        ) : null}
      </div>

      {access === null ? <Loader /> : null}
      {access?.status === "admin" ? <AdminTabs /> : null}
      {access?.status === "locked" ? (
        <UnlockPanel
          onUnlocked={() => setAccess({ status: "admin", accountId: access.accountId })}
        />
      ) : null}
      {access?.status === "off" || access?.status === "not_admin" ? (
        <ClosedPanel access={access} />
      ) : null}

      <Link href="/" className="pixel-button px-4 py-3 text-xs">
        BACK TO HOME
      </Link>
    </section>
  );
}

function ClosedPanel({ access }: { access: AdminAccessStatus }) {
  return (
    <div className="pixel-panel flex flex-col gap-2 p-3">
      <p>
        {access.status === "off"
          ? "The admin area is switched off. It needs ADMIN_USER_ID and ADMIN_PASSWORD in the keys file."
          : "This page is not open to this account."}
      </p>
      {access.accountId ? (
        <p className="break-all text-chalk-dim">
          Your account ID: <span className="text-chalk">{access.accountId}</span>
        </p>
      ) : (
        <p className="text-chalk-dim">Sign in on the Account page to see your account ID.</p>
      )}
    </div>
  );
}
