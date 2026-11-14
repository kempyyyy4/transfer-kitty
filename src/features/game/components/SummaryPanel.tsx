"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TIERS } from "@/config/tiers";
import { TierSprite } from "@/features/avatar";
import { AdSlot } from "@/features/ads";
import { YourRank } from "@/features/leaderboard";
import { formatFee } from "@/features/scoring";
import { ShareButton } from "@/features/share";
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

  const daily = summary.mode === "daily";

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-pixel text-lg leading-relaxed text-floodlight">{titleOf(summary)}</h1>
      <div className="flex flex-col items-center gap-2">
        <p className="font-pixel text-[10px] text-chalk-dim">YOUR KITTY</p>
        <p
          className="border-4 border-stand bg-black px-6 py-3 font-pixel text-3xl text-scoreboard"
          style={{ textShadow: "0 0 6px #ffb000" }}
        >
          {formatFee(summary.totalFee)}
        </p>
      </div>
      {daily && summary.coinsEarned > 0 ? (
        <p className="text-center font-pixel text-xs text-scoreboard">
          +{summary.coinsEarned} COINS
        </p>
      ) : null}
      {daily ? <YourRank /> : null}
      {daily && summary.puzzleNumber && summary.completed ? (
        <ShareButton
          puzzleNumber={summary.puzzleNumber}
          totalFee={summary.totalFee}
          tierLevels={summary.answers.map((answer) => answer.tier)}
        />
      ) : null}

      <ol className="flex flex-col gap-4">
        {summary.answers.map((answer) => {
          const list = lists?.find((question) => question.position === answer.position);
          const spriteKey = TIERS.find((tier) => tier.level === answer.tier)?.spriteKey;
          return (
            <li key={answer.position} className="pixel-panel flex flex-col gap-2 p-3">
              <p className="text-lg text-chalk-dim">
                {answer.position}. {answer.prompt}
              </p>
              <div className="flex items-center gap-3">
                {spriteKey ? (
                  <TierSprite spriteKey={spriteKey} label={tierName(answer.tier)} scale={2} />
                ) : null}
                <div>
                  <p className="text-xl">{outcomeLine(answer.outcome, answer.answer)}</p>
                  <p className="text-lg">
                    <span className="font-pixel text-[10px] text-floodlight">
                      {tierName(answer.tier).toUpperCase()}
                    </span>{" "}
                    · {formatFee(answer.fee)}
                    {answer.outcome === "correct" ? ` · ${answer.percent}% said this` : ""}
                  </p>
                </div>
              </div>
              {list ? <AnswerList sessionId={sessionId} question={list} /> : null}
            </li>
          );
        })}
      </ol>

      <AdSlot />
      {daily ? (
        <p className="text-xl">
          That is today&apos;s game done. A new one starts at midnight UK time.
        </p>
      ) : (
        <p className="text-xl text-chalk-dim">
          Just for fun: this round does not count on Top Kitties or earn coins.
        </p>
      )}
      {summary.mode === "unlimited" || summary.mode === "pack" ? (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="pixel-button border-floodlight px-4 py-3 text-xs text-floodlight"
        >
          PLAY ANOTHER ROUND
        </button>
      ) : null}
      {summary.mode === "archive" ? (
        <Link href="/archive" className="pixel-button px-4 py-3 text-xs">
          BACK TO THE ARCHIVE
        </Link>
      ) : null}
      <Link href="/" className="pixel-button px-4 py-3 text-xs">
        BACK TO HOME
      </Link>
    </section>
  );
}

function titleOf(summary: GameSummary): string {
  if (summary.mode === "unlimited") return "UNLIMITED";
  if (summary.mode === "pack") return (summary.packName ?? "PACK").toUpperCase();
  const number = summary.puzzleNumber ? ` #${summary.puzzleNumber}` : "";
  return summary.mode === "archive" ? `ARCHIVE${number}` : `TRANSFER KITTY${number}`;
}
