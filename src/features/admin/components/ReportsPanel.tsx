"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { adminApi } from "../api-client";
import type { OpenReport } from "../types";
import { TierSelect } from "./TierSelect";
import { ActionMessage, useAction } from "./use-action";

/** Players' reports of missing answers. Check each one before adding it. */
export function ReportsPanel({ onOpen }: { onOpen: (id: string) => void }) {
  const [reports, setReports] = useState<OpenReport[] | null>(null);
  const { busy, message, run } = useAction();

  const reload = useCallback(
    () =>
      adminApi
        .reports()
        .then(setReports)
        .catch(() => setReports([])),
    [],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!reports) return <Loader />;
  const act = (action: () => Promise<unknown>, success: string) =>
    run(action, success).then((ok) => (ok ? reload() : undefined));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-chalk-dim">
        Check a reported player against a trusted source before adding them.
      </p>
      <ActionMessage message={message} />
      {reports.length === 0 ? <p>No open reports.</p> : null}
      <ul className="flex flex-col gap-2">
        {reports.map((report) => (
          <ReportRow
            key={`${report.questionId}:${report.playerId}`}
            report={report}
            busy={busy}
            onOpen={() => onOpen(report.questionId)}
            onAdd={(tier) =>
              void act(
                () => adminApi.addAnswer(report.questionId, report.playerId, tier),
                `${report.playerName} added.`,
              )
            }
            onDismiss={() =>
              void act(
                () => adminApi.dismissReport(report.questionId, report.playerId),
                "Report dismissed.",
              )
            }
          />
        ))}
      </ul>
    </div>
  );
}

interface RowProps {
  report: OpenReport;
  busy: boolean;
  onOpen: () => void;
  onAdd: (tier: number) => void;
  onDismiss: () => void;
}

function ReportRow({ report, busy, onOpen, onAdd, onDismiss }: RowProps) {
  const [tier, setTier] = useState<number | null>(1);

  return (
    <li className="pixel-panel flex flex-col gap-2 p-2">
      <button type="button" onClick={onOpen} className="text-left text-lg hover:text-floodlight">
        {report.prompt}
      </button>
      <p>
        {report.playerName}
        <span className="text-chalk-dim">
          {report.birthYear ? ` · born ${report.birthYear}` : ""} · reported {report.reports}{" "}
          {report.reports === 1 ? "time" : "times"}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <TierSelect label={`Tier for ${report.playerName}`} value={tier} onChange={setTier} />
        <button
          type="button"
          disabled={busy}
          onClick={() => onAdd(tier ?? 1)}
          className="pixel-button px-2 py-1 text-[10px]"
        >
          ADD AS ANSWER
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDismiss}
          className="pixel-button px-2 py-1 text-[10px]"
        >
          DISMISS
        </button>
      </div>
    </li>
  );
}
