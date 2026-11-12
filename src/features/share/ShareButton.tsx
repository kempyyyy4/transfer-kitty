"use client";

import { useState } from "react";
import { shareText, type ShareInput } from "./share-text";

/** Copies the spoiler-free result to the clipboard, ready to paste into a chat. */
export function ShareButton(props: ShareInput) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const text = shareText(props);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // Some browsers refuse the clipboard; the text is shown so it can be copied by hand.
      setState("failed");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => void copy()}
        className="pixel-button w-full border-floodlight px-4 py-4 text-sm text-floodlight"
      >
        {state === "copied" ? "COPIED!" : "SHARE YOUR KITTY"}
      </button>
      {state === "failed" ? (
        <pre className="pixel-panel w-full p-3 text-lg whitespace-pre-wrap">{text}</pre>
      ) : null}
    </div>
  );
}
