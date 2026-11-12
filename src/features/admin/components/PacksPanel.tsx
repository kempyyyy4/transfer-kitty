"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { adminApi } from "../api-client";
import type { PackRow } from "../types";
import { NewPackForm } from "./NewPackForm";
import { PackDetailPanel } from "./PackDetailPanel";
import { PACK_KIND_LABELS } from "./pack-kinds";

/** Themed question packs. Questions are added to a pack from the question's own screen. */
export function PacksPanel({ onOpen }: { onOpen: (questionId: string) => void }) {
  const [packs, setPacks] = useState<PackRow[] | null>(null);
  const [openPack, setOpenPack] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      adminApi
        .packs()
        .then(setPacks)
        .catch(() => setPacks([])),
    [],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  if (openPack) {
    return (
      <PackDetailPanel
        packId={openPack}
        onOpenQuestion={onOpen}
        onBack={() => {
          setOpenPack(null);
          void reload();
        }}
      />
    );
  }
  if (!packs) return <Loader />;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-chalk-dim">
        Packs go on sale in a later stage. Players will never see a draft pack.
      </p>
      <ul className="flex flex-col gap-2">
        {packs.map((pack) => (
          <li key={pack.id}>
            <button
              type="button"
              onClick={() => setOpenPack(pack.id)}
              className="pixel-panel w-full p-2 text-left hover:border-floodlight"
            >
              <span className="block text-lg">{pack.name}</span>
              <span className="block text-chalk-dim">
                {PACK_KIND_LABELS[pack.kind]} · {pack.status} · {pack.questionCount} questions
              </span>
            </button>
          </li>
        ))}
      </ul>
      {packs.length === 0 ? <p>No packs yet.</p> : null}
      <NewPackForm onCreated={(id) => setOpenPack(id)} />
    </div>
  );
}
