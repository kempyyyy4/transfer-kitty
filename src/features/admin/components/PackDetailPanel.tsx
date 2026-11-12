"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { adminApi } from "../api-client";
import type { PackDetail, PackStatus } from "../types";
import { PACK_KIND_LABELS } from "./pack-kinds";
import { ActionMessage, useAction } from "./use-action";

const STATUSES: PackStatus[] = ["draft", "live", "retired"];

interface Props {
  packId: string;
  onBack: () => void;
  onOpenQuestion: (questionId: string) => void;
}

export function PackDetailPanel({ packId, onBack, onOpenQuestion }: Props) {
  const [pack, setPack] = useState<PackDetail | null>(null);
  const { busy, message, run } = useAction();

  const reload = useCallback(
    () =>
      adminApi
        .pack(packId)
        .then(setPack)
        .catch(() => undefined),
    [packId],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!pack) return <Loader />;
  const act = (action: () => Promise<unknown>, success: string) =>
    run(action, success).then((ok) => (ok ? reload() : undefined));

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="pixel-button self-start px-3 py-2 text-[10px]"
      >
        BACK
      </button>
      <h2 className="text-2xl">{pack.name}</h2>
      <p className="text-chalk-dim">
        {PACK_KIND_LABELS[pack.kind]} · web name {pack.slug}
        {pack.description ? ` · ${pack.description}` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-chalk-dim">Status:</span>
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            disabled={busy || pack.status === status}
            aria-pressed={pack.status === status}
            onClick={() =>
              void act(() => adminApi.changePack(pack.id, { status }), `Now ${status}.`)
            }
            className={`pixel-button px-2 py-1 text-[10px] ${
              pack.status === status ? "border-floodlight text-floodlight" : ""
            }`}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>
      <ActionMessage message={message} />

      <p className="font-pixel text-[10px] text-floodlight">{pack.questions.length} QUESTIONS</p>
      {pack.questions.length === 0 ? (
        <p className="text-chalk-dim">
          Open a question from the Questions tab and use Add to pack.
        </p>
      ) : null}
      <ul className="flex flex-col">
        {pack.questions.map((question) => (
          <li
            key={question.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-stand py-1"
          >
            <button
              type="button"
              onClick={() => onOpenQuestion(question.id)}
              className="text-left hover:text-floodlight"
            >
              {question.prompt}
              <span className="text-chalk-dim"> · {question.status}</span>
            </button>
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
    </div>
  );
}
