"use client";

import { useState } from "react";
import { formatFee } from "@/features/scoring";
import { toSearchName } from "@/lib/search-name";
import type { QuestionAnswers } from "../types";
import { ReportMissing } from "./ReportMissing";
import { tierName } from "./tier-label";

/** Every valid answer to one question, with a search box. Shown only after the round. */
export function AnswerList({
  sessionId,
  question,
}: {
  sessionId: string;
  question: QuestionAnswers;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const query = toSearchName(filter);
  const shown = query
    ? question.answers.filter((answer) => toSearchName(answer.name).includes(query))
    : question.answers;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pixel-button self-start px-3 py-2 text-[10px]"
      >
        Show all {question.answers.length} answers
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-lg text-chalk-dim">
        Search the answers
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          autoComplete="off"
          className="pixel-input p-2"
        />
      </label>
      <ul className="flex max-h-80 flex-col overflow-y-auto text-lg">
        {shown.map((answer) => (
          <li
            key={answer.id}
            className={`flex justify-between gap-2 border-b-2 border-stand py-1 ${
              answer.id === question.yourAnswerId ? "text-floodlight" : ""
            }`}
          >
            <span>{answer.name}</span>
            <span className="shrink-0 text-right">
              {tierName(answer.tier)} · {formatFee(answer.fee)} · {answer.percent}%
            </span>
          </li>
        ))}
        {shown.length === 0 ? <li className="py-1">No answer matches that name.</li> : null}
      </ul>
      <ReportMissing
        sessionId={sessionId}
        position={question.position}
        answerIds={new Set(question.answers.map((answer) => answer.id))}
      />
    </div>
  );
}
