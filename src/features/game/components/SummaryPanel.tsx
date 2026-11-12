"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { YourRank } from "@/features/leaderboard";
import { formatFee } from "@/features/scoring";
import { gameApi } from "../api-client";
import type { GameSummary, QuestionAnswers } from "../types";
import { AnswerList } from "./AnswerList";
import { outcomeLine, tierName } from "./tier-label";

interface Props {
  sessionId: string;
  summary: GameSummary;
}

/**
 * The Results screen: each answer with its tier, fee and share of players, the day's
 * kitty, and every valid answer once the round is over. Rank, coins and sharing join in
 * later stages.
 */
export function SummaryPanel({ sessionId, summary }: Props) {
  const [lists, setLists] = useState<QuestionAnswers[] | null>(null);

  useEffect(() => {
    gameApi
      .answerLists(sessionId)
      .then(setLists)
      // Without the lists the rest of the results still show; they are a bonus.
      .catch(() => undefined);
  }, [sessionId]);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">
        Transfer Kitty{summary.puzzleNumber ? ` #${summary.puzzleNumber}` : ""}
      </h1>
      <p className="text-xl">
        Your kitty: <strong>{formatFee(summary.totalFee)}</strong>
      </p>
      <YourRank />

      <ol className="flex flex-col gap-3">
        {summary.answers.map((answer) => {
          const list = lists?.find((question) => question.position === answer.position);
          return (
            <li key={answer.position} className="flex flex-col gap-2 border-2 border-slate-600 p-3">
              <p className="text-sm text-slate-400">
                {answer.position}. {answer.prompt}
              </p>
              <p>{outcomeLine(answer.outcome, answer.answer)}</p>
              <p>
                <strong>{tierName(answer.tier)}</strong> · {formatFee(answer.fee)}
                {answer.outcome === "correct" ? ` · ${answer.percent}% of players said this` : ""}
              </p>
              {list ? <AnswerList question={list} /> : null}
            </li>
          );
        })}
      </ol>

      <p>That is today&apos;s game done. A new one starts at midnight UK time.</p>
      <Link href="/" className="border-2 border-slate-100 p-3 text-center font-bold">
        Back to home
      </Link>
    </section>
  );
}
