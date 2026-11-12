import Link from "next/link";
import { formatFee } from "@/features/scoring";
import type { GameSummary } from "../types";
import { outcomeLine, tierName } from "./tier-label";

/** The end-of-game breakdown. Plain for now: the full Results screen comes in stage 5. */
export function SummaryPanel({ summary }: { summary: GameSummary }) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">
        Transfer Kitty{summary.puzzleNumber ? ` #${summary.puzzleNumber}` : ""}
      </h1>
      <p className="text-xl">
        Your kitty: <strong>{formatFee(summary.totalFee)}</strong>
      </p>

      <ol className="flex flex-col gap-3">
        {summary.answers.map((answer) => (
          <li key={answer.position} className="border-2 border-slate-600 p-3">
            <p className="text-sm text-slate-400">
              {answer.position}. {answer.prompt}
            </p>
            <p>{outcomeLine(answer.outcome, answer.answer)}</p>
            <p>
              <strong>{tierName(answer.tier)}</strong> · {formatFee(answer.fee)}
              {answer.outcome === "correct" ? ` · ${answer.percent}% of players said this` : ""}
            </p>
          </li>
        ))}
      </ol>

      <p>That is today&apos;s game done. A new one starts at midnight UK time.</p>
      <Link href="/" className="border-2 border-slate-100 p-3 text-center font-bold">
        Back to home
      </Link>
    </section>
  );
}
