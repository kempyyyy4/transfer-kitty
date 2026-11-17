"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { CountUp } from "@/components/CountUp";
import { TIERS } from "@/config/tiers";
import { playCashRegister } from "@/features/audio";
import { TierSprite } from "@/features/avatar";
import { AdSlot } from "@/features/ads";
import { YourRank } from "@/features/leaderboard";
import { formatFee } from "@/features/scoring";
import { ShareButton } from "@/features/share";
import { gameApi } from "../api-client";
import type { GameSummary, QuestionAnswers } from "../types";
import { AnswerList } from "./AnswerList";
import { outcomeLine, tierColour, tierName } from "./tier-label";

interface Props {
  sessionId: string;
  summary: GameSummary;
}

/** How long the kitty takes to roll up on the scoreboard. */
const ROLL_MS = 1400;

/**
 * The Results screen: the kitty rolling up on the scoreboard, the round as a row of tier
 * colours, rank, coins and sharing, then each answer in its tier's colour with every valid
 * answer underneath.
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

  // Ka-ching as the scoreboard settles on the total.
  useEffect(() => {
    if (summary.totalFee <= 0) return;
    const ring = setTimeout(playCashRegister, ROLL_MS - 100);
    return () => clearTimeout(ring);
  }, [summary.totalFee]);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="page-title">{titleOf(summary)}</h1>
      <div className="pixel-panel flex flex-col items-center gap-3 p-4">
        <p className="font-pixel text-[10px] tracking-widest text-chalk-dim">YOUR KITTY</p>
        <p
          className="w-full border-4 border-black bg-black px-4 py-3 text-center font-pixel text-4xl text-scoreboard"
          style={{ textShadow: "0 0 10px #ffb000" }}
        >
          <CountUp value={summary.totalFee} format={formatFee} durationMs={ROLL_MS} />
        </p>
        <TierRow tiers={summary.answers.map((answer) => answer.tier)} />
        {daily && summary.coinsEarned > 0 ? (
          <p className="font-pixel text-xs text-scoreboard">+{summary.coinsEarned} COINS</p>
        ) : null}
      </div>
      {daily ? <YourRank /> : null}
      {daily && summary.puzzleNumber && summary.completed ? (
        <ShareButton
          puzzleNumber={summary.puzzleNumber}
          totalFee={summary.totalFee}
          tierLevels={summary.answers.map((answer) => answer.tier)}
        />
      ) : null}

      <ol className="flex flex-col gap-3">
        {summary.answers.map((answer) => {
          const list = lists?.find((question) => question.position === answer.position);
          const spriteKey = TIERS.find((tier) => tier.level === answer.tier)?.spriteKey;
          return (
            <li
              key={answer.position}
              className="pixel-panel animate-page-in flex flex-col gap-2 border-l-8 p-3"
              style={{
                borderLeftColor: tierColour(answer.tier),
                animationDelay: `${answer.position * 60}ms`,
              }}
            >
              <p className="text-lg leading-snug text-chalk-dim">
                <span className="font-pixel text-[10px] text-chalk">{answer.position}</span>{" "}
                {answer.prompt}
              </p>
              <div className="flex items-center gap-3">
                {spriteKey ? (
                  <TierSprite spriteKey={spriteKey} label={tierName(answer.tier)} scale={2} />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-xl leading-tight">
                    {outcomeLine(answer.outcome, answer.answer)}
                  </p>
                  <p className="font-pixel text-[10px]" style={{ color: tierColour(answer.tier) }}>
                    {tierName(answer.tier).toUpperCase()}
                  </p>
                </div>
                <p className="shrink-0 font-pixel text-sm text-scoreboard">
                  {formatFee(answer.fee)}
                </p>
              </div>
              {list ? <AnswerList sessionId={sessionId} question={list} /> : null}
            </li>
          );
        })}
      </ol>

      {daily ? (
        <Link
          href="/unlimited"
          className="pixel-button flex flex-col gap-1 border-floodlight bg-floodlight p-4 text-left text-night-deep"
        >
          <span className="font-pixel text-base">PLAY UNLIMITED NOW</span>
          <span className="font-mono text-xl">Endless rounds of 7, no waiting for tomorrow.</span>
        </Link>
      ) : null}
      <AdSlot />
      {daily ? (
        <p className="text-center text-xl">
          Today&apos;s game is done. The next one kicks off in{" "}
          <span className="font-pixel text-sm text-floodlight">
            <Countdown />
          </span>
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
    </section>
  );
}

function titleOf(summary: GameSummary): string {
  if (summary.mode === "unlimited") return "UNLIMITED";
  if (summary.mode === "pack") return (summary.packName ?? "PACK").toUpperCase();
  const number = summary.puzzleNumber ? ` #${summary.puzzleNumber}` : "";
  return summary.mode === "archive" ? `ARCHIVE${number}` : `TRANSFER KITTY${number}`;
}

/** The round at a glance: one square per answer in its tier's colour, like the share text. */
function TierRow({ tiers }: { tiers: readonly number[] }) {
  return (
    <div className="flex gap-1.5" aria-label="Your round, one square per answer">
      {tiers.map((tier, index) => (
        <span
          key={index}
          title={tierName(tier)}
          className="animate-sprite-pop h-6 w-6 border-2 border-black"
          style={{ backgroundColor: tierColour(tier), animationDelay: `${400 + index * 90}ms` }}
        />
      ))}
    </div>
  );
}
