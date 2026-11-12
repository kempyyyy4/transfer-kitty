"use client";

import { useCallback, useState } from "react";

/**
 * Runs one admin action at a time and keeps its result message, so every panel reports
 * success and failure the same way.
 */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; failed: boolean } | null>(null);

  const run = useCallback(async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      if (success) setMessage({ text: success, failed: false });
      return true;
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Something went wrong.",
        failed: true,
      });
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, message, run };
}

export function ActionMessage({ message }: { message: { text: string; failed: boolean } | null }) {
  if (!message) return null;
  return (
    <p role="status" className={message.failed ? "text-claret" : "text-turf-light"}>
      {message.text}
    </p>
  );
}
