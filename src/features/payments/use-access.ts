"use client";

import { useEffect, useState } from "react";
import { paymentsApi } from "./api-client";
import type { Access } from "./types";

/** The visitor's purchases, or null while loading. A failed load counts as none. */
export function useAccess(): Access | null {
  const [access, setAccess] = useState<Access | null>(null);
  useEffect(() => {
    paymentsApi
      .access()
      .catch((): Access => ({ lifetime: false, packIds: [] }))
      .then(setAccess);
  }, []);
  return access;
}
