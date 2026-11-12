"use client";

import { useState, type FormEvent } from "react";
import { ACCOUNT } from "@/config/account";
import { accountApi, AccountApiError } from "../api-client";

interface Props {
  current: string | null;
  onSaved: (name: string) => void;
}

/** Choose or change the name shown on Top Kitties. */
export function NamePanel({ current, onSaved }: Props) {
  const [name, setName] = useState(current ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      const saved = await accountApi.setName(name);
      onSaved(saved.displayName);
      setMessage("Saved.");
    } catch (failure) {
      setMessage(failure instanceof AccountApiError ? failure.message : "Could not save the name.");
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-2">
      <label htmlFor="display-name">Your name on Top Kitties</label>
      <div className="flex gap-2">
        <input
          id="display-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          minLength={ACCOUNT.displayNameMinLength}
          maxLength={ACCOUNT.displayNameMaxLength}
          autoComplete="nickname"
          className="min-w-0 flex-1 border-2 border-slate-100 bg-slate-900 p-3"
        />
        <button type="submit" className="border-2 border-amber-400 px-4 font-bold">
          Save
        </button>
      </div>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
