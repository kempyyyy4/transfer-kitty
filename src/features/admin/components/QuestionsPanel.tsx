"use client";

import { useEffect, useState } from "react";
import { ADMIN } from "@/config/admin";
import { Loader } from "@/components/Loader";
import { adminApi, type QuestionFilter } from "../api-client";
import type { AdminQuestionList } from "../types";

/** Wait this long after typing before searching. */
const SEARCH_DELAY_MS = 300;

export function QuestionsPanel({ onOpen }: { onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<QuestionFilter>({ q: "", status: "", source: "", page: 1 });
  const [list, setList] = useState<AdminQuestionList | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      adminApi
        .questions(filter)
        .then((loaded) => {
          setList(loaded);
          setFailed(false);
        })
        .catch(() => setFailed(true));
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [filter]);

  const pages = list ? Math.max(1, Math.ceil(list.total / ADMIN.questionsPerPage)) : 1;
  const change = (next: Partial<QuestionFilter>) => setFilter({ ...filter, page: 1, ...next });

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-lg text-chalk-dim">
        Search the questions
        <input
          value={filter.q}
          onChange={(event) => change({ q: event.target.value })}
          maxLength={100}
          className="pixel-input p-2"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Status"
          value={filter.status}
          onChange={(event) => change({ status: event.target.value as QuestionFilter["status"] })}
          className="pixel-input p-1 text-base"
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="retired">Retired</option>
        </select>
        <select
          aria-label="Source"
          value={filter.source}
          onChange={(event) => change({ source: event.target.value as QuestionFilter["source"] })}
          className="pixel-input p-1 text-base"
        >
          <option value="">Any source</option>
          <option value="generated">From data</option>
          <option value="manual">Hand-written</option>
        </select>
      </div>

      {failed ? <p className="text-claret">The questions did not load.</p> : null}
      {list === null && !failed ? <Loader /> : null}
      {list ? (
        <>
          <p className="text-chalk-dim">{list.total.toLocaleString("en-GB")} questions</p>
          <ul className="flex flex-col gap-2">
            {list.rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onOpen(row.id)}
                  className="pixel-panel w-full p-2 text-left hover:border-floodlight"
                >
                  <span className="block text-lg">{row.prompt}</span>
                  <span className="block text-chalk-dim">
                    {row.status} · {row.source === "manual" ? "hand-written" : "from data"} ·{" "}
                    {row.answerCount} answers · played {row.timesPlayed}
                    {row.puzzleDate ? ` · daily ${row.puzzleDate}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={filter.page <= 1}
              onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
              className="pixel-button px-3 py-2 text-[10px]"
            >
              PREV
            </button>
            <span>
              Page {filter.page} of {pages}
            </span>
            <button
              type="button"
              disabled={filter.page >= pages}
              onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
              className="pixel-button px-3 py-2 text-[10px]"
            >
              NEXT
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
