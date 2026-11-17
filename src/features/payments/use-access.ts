"use client";

import { useEffect, useState } from "react";
import { paymentsApi } from "./api-client";
import type { Access } from "./types";

const NO_ACCESS: Access = { lifetime: false, packIds: [] };

/**
 * The last answer, kept while the tab is open, so moving between screens shows the
 * right buttons at once. Each screen still asks again in the background, so a purchase
 * shows up as soon as the server knows about it.
 */
let remembered: Access | null = null;
let asking: Promise<Access> | null = null;

function askServer(): Promise<Access> {
  asking ??= paymentsApi
    .access()
    .catch(() => NO_ACCESS)
    .then((access) => {
      remembered = access;
      asking = null;
      return access;
    });
  return asking;
}

/** The visitor's purchases, or null while first loading. A failed load counts as none. */
export function useAccess(): Access | null {
  const [access, setAccess] = useState<Access | null>(remembered);
  useEffect(() => {
    let current = true;
    void askServer().then((latest) => {
      if (current) setAccess(latest);
    });
    return () => {
      current = false;
    };
  }, []);
  return access;
}
