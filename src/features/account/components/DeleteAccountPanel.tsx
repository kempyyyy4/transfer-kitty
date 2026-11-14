"use client";

import { useState } from "react";
import { accountApi, AccountApiError } from "../api-client";

const CONFIRM_WORD = "DELETE";

/** Deletes the account for good, after the player types DELETE. */
export function DeleteAccountPanel({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-lg text-chalk-dim underline hover:text-claret"
      >
        Delete my account
      </button>
    );
  }

  async function remove() {
    setBusy(true);
    setMessage(null);
    try {
      await accountApi.deleteAccount();
      onDeleted();
    } catch (failure) {
      setMessage(failure instanceof AccountApiError ? failure.message : "That did not work.");
      setBusy(false);
    }
  }

  return (
    <div className="pixel-panel flex flex-col gap-2 border-claret p-3">
      <p className="font-pixel text-[10px] text-claret">DELETE MY ACCOUNT</p>
      <p>This cannot be undone. It removes for good:</p>
      <ul className="list-inside list-disc">
        <li>your games, streaks and place on Top Kitties</li>
        <li>your coins and shop items</li>
        <li>the lifetime unlock and packs, if you bought them</li>
        <li>your name and avatar</li>
      </ul>
      <p>Leagues you created pass to another member.</p>
      <label className="flex flex-col gap-1 text-lg text-chalk-dim">
        Type {CONFIRM_WORD} to confirm
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          className="pixel-input p-2"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || typed !== CONFIRM_WORD}
          onClick={() => void remove()}
          className="pixel-button border-claret px-3 py-2 text-[10px] text-claret"
        >
          DELETE FOR GOOD
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="pixel-button px-3 py-2 text-[10px]"
        >
          KEEP MY ACCOUNT
        </button>
      </div>
      {message ? (
        <p role="status" className="text-claret">
          {message}
        </p>
      ) : null}
    </div>
  );
}
