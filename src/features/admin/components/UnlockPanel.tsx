"use client";

import { useState } from "react";
import { adminApi } from "../api-client";
import { ActionMessage, useAction } from "./use-action";

export function UnlockPanel({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState("");
  const { busy, message, run } = useAction();

  return (
    <form
      className="pixel-panel flex flex-col gap-2 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void run(() => adminApi.unlock(password)).then((ok) => {
          setPassword("");
          if (ok) onUnlocked();
        });
      }}
    >
      <label className="flex flex-col gap-1 text-lg text-chalk-dim">
        Admin password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className="pixel-input p-2"
        />
      </label>
      <button
        type="submit"
        disabled={busy || password === ""}
        className="pixel-button self-start px-3 py-2 text-[10px]"
      >
        UNLOCK
      </button>
      <ActionMessage message={message} />
    </form>
  );
}
