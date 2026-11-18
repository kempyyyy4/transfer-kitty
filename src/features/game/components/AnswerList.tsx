"use client";

import { useState } from "react";
import { formatFee } from "@/features/scoring";
import { toSearchName } from "@/lib/search-name";
import type { QuestionAnswers } from "../types";
import { ReportMissing } from "./ReportMissing";
import { tierColour, tierName } from "./tier-label";

/**
 * Every valid answer to one question, grouped by tier with the rarest first, each tier in
 * its own colour, with a search box. Shown only after the round.
 */
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
        SHOW ALL {question.answers.length} ANSWERS
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
      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
        {groupByTier(shown).map(({ tier, fee, answers }) => (
          <section key={tier}>
            <h3
              className="sticky top-0 flex justify-between border-b-4 px-2 py-1 font-pixel text-[10px] text-night-deep"
              style={{ backgroundColor: tierColour(tier), borderColor: "#000" }}
            >
              <span>
                {tierName(tier).toUpperCase()} · {answers.length}
              </span>
              <span>{formatFee(fee)}</span>
            </h3>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 px-2 py-2 text-lg">
              {answers.map((answer) => (
                <li
                  key={answer.id}
                  className={answer.id === question.yourAnswerId ? "font-bold text-floodlight" : ""}
                >
                  {answer.id === question.yourAnswerId ? "▶ " : ""}
                  {answer.name}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {shown.length === 0 ? <p className="py-1">No answer matches that name.</p> : null}
      </div>
      <ReportMissing
        sessionId={sessionId}
        position={question.position}
        answerIds={new Set(question.answers.map((answer) => answer.id))}
      />
    </div>
  );
}

/** Answers in tier groups, rarest tier first. Within a tier, the server's order is kept. */
function groupByTier(answers: QuestionAnswers["answers"]) {
  const groups = new Map<
    number,
    { tier: number; fee: number; answers: QuestionAnswers["answers"] }
  >();
  for (const answer of answers) {
    const group = groups.get(answer.tier) ?? { tier: answer.tier, fee: answer.fee, answers: [] };
    group.answers.push(answer);
    groups.set(answer.tier, group);
  }
  return [...groups.values()].sort((a, b) => b.tier - a.tier);
}
