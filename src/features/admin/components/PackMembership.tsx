"use client";

import { useEffect, useState } from "react";
import { adminApi } from "../api-client";
import type { AdminQuestionDetail, PackRow } from "../types";
import { ActionMessage, useAction } from "./use-action";

interface Props {
  question: AdminQuestionDetail;
  onChanged: () => void;
}

/** Which packs a question is in, with a way to add it to another or take it out. */
export function PackMembership({ question, onChanged }: Props) {
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [chosen, setChosen] = useState("");
  const { busy, message, run } = useAction();

  useEffect(() => {
    adminApi
      .packs()
      .then(setPacks)
      .catch(() => undefined);
  }, []);

  const inPacks = new Set(question.packs.map((pack) => pack.id));
  const others = packs.filter((pack) => !inPacks.has(pack.id));
  const act = (action: () => Promise<unknown>, success: string) =>
    run(action, success).then((ok) => (ok ? onChanged() : undefined));

  return (
    <div className="pixel-panel flex flex-col gap-2 p-3">
      <p className="font-pixel text-[10px] text-floodlight">PACKS</p>
      {question.packs.length === 0 ? <p className="text-chalk-dim">In no pack.</p> : null}
      <ul className="flex flex-col gap-1">
        {question.packs.map((pack) => (
          <li key={pack.id} className="flex flex-wrap items-center justify-between gap-2">
            <span>{pack.name}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void act(() => adminApi.removeFromPack(pack.id, question.id), "Taken out.")
              }
              className="pixel-button px-2 py-1 text-[10px]"
            >
              TAKE OUT
            </button>
          </li>
        ))}
      </ul>
      {others.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Pack to add this question to"
            value={chosen}
            onChange={(event) => setChosen(event.target.value)}
            className="pixel-input p-1 text-base"
          >
            <option value="">Choose a pack</option>
            {others.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || chosen === ""}
            onClick={() =>
              void act(() => adminApi.addToPack(chosen, question.id), "Added to the pack.").then(
                () => setChosen(""),
              )
            }
            className="pixel-button px-2 py-1 text-[10px]"
          >
            ADD TO PACK
          </button>
        </div>
      ) : null}
      <ActionMessage message={message} />
    </div>
  );
}
