"use client";

import { useState } from "react";
import { toSearchName } from "@/lib/search-name";
import { adminApi } from "../api-client";
import type { PackKind } from "../types";
import { PACK_KIND_LABELS } from "./pack-kinds";
import { ActionMessage, useAction } from "./use-action";

/** "Messi Pack" becomes "messi-pack". */
function toSlug(name: string): string {
  return toSearchName(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function NewPackForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<PackKind>("era");
  const { busy, message, run } = useAction();
  const slug = toSlug(name);

  return (
    <form
      className="pixel-panel flex flex-col gap-2 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        let id = "";
        void run(async () => {
          id = (await adminApi.createPack({ slug, name, description, kind })).id;
        }).then((ok) => {
          if (ok) onCreated(id);
        });
      }}
    >
      <p className="font-pixel text-[10px] text-floodlight">NEW PACK</p>
      <label className="flex flex-col gap-1 text-lg text-chalk-dim">
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          className="pixel-input p-2"
        />
      </label>
      <p className="text-chalk-dim">Web name: {slug || "(type a name)"}</p>
      <label className="flex flex-col gap-1 text-lg text-chalk-dim">
        Description
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={200}
          className="pixel-input p-2"
        />
      </label>
      <select
        aria-label="Kind of pack"
        value={kind}
        onChange={(event) => setKind(event.target.value as PackKind)}
        className="pixel-input self-start p-1 text-base"
      >
        {Object.entries(PACK_KIND_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={busy || name.trim().length < 3 || slug.length < 3}
        className="pixel-button self-start px-3 py-2 text-[10px]"
      >
        ADD PACK
      </button>
      <ActionMessage message={message} />
    </form>
  );
}
