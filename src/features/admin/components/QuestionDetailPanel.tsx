"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { PlayerPicker } from "@/components/PlayerPicker";
import { adminApi } from "../api-client";
import type { AdminQuestionDetail, QuestionStatus } from "../types";
import { AnswerRow } from "./AnswerRow";
import { PackMembership } from "./PackMembership";
import { TierSelect } from "./TierSelect";
import { ActionMessage, useAction } from "./use-action";

const STATUSES: QuestionStatus[] = ["active", "draft", "retired"];

interface Props {
  questionId: string;
  onBack: () => void;
}

export function QuestionDetailPanel({ questionId, onBack }: Props) {
  const [question, setQuestion] = useState<AdminQuestionDetail | null>(null);
  const [newTier, setNewTier] = useState<number | null>(1);
  const { busy, message, run } = useAction();

  const reload = useCallback(
    () =>
      adminApi
        .question(questionId)
        .then(setQuestion)
        .catch(() => undefined),
    [questionId],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!question) return <Loader />;
  const answerIds = new Set(question.answers.map((answer) => answer.id));
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
      <h2 className="text-2xl">{question.prompt}</h2>
      <p className="text-chalk-dim">
        {question.source === "manual" ? "Hand-written" : `From ${question.dataSource}`} · played{" "}
        {question.timesPlayed} · prominence {Math.round(question.prominence)}
        {question.puzzleDate ? ` · daily puzzle ${question.puzzleDate}` : ""}
        {question.tiersRecalculatedAt ? " · tiers set by players" : " · tiers from data"}
      </p>
      {question.liveToday ? (
        <p className="pixel-panel border-floodlight p-2">
          This question is in today&apos;s puzzle. Its answers and tiers are frozen until midnight.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-chalk-dim">Status:</span>
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            disabled={busy || question.status === status}
            aria-pressed={question.status === status}
            onClick={() =>
              void act(() => adminApi.setStatus(question.id, status), `Now ${status}.`)
            }
            className={`pixel-button px-2 py-1 text-[10px] ${
              question.status === status ? "border-floodlight text-floodlight" : ""
            }`}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>
      <ActionMessage message={message} />

      <PackMembership question={question} onChanged={() => void reload()} />

      <div className="pixel-panel flex flex-col gap-2 p-3">
        <p className="font-pixel text-[10px] text-floodlight">ADD AN ANSWER</p>
        <TierSelect label="Tier for the new answer" value={newTier} onChange={setNewTier} />
        <PlayerPicker
          label="Find the player"
          search={adminApi.searchPlayers}
          exclude={answerIds}
          onPick={(player) =>
            void act(
              () => adminApi.addAnswer(question.id, player.id, newTier ?? 1),
              `${player.name} added.`,
            )
          }
        />
      </div>

      <p className="font-pixel text-[10px] text-floodlight">{question.answers.length} ANSWERS</p>
      <ul className="flex flex-col">
        {question.answers.map((answer) => (
          <AnswerRow
            key={answer.id}
            answer={answer}
            disabled={busy || question.liveToday}
            onOverride={(tier) =>
              void act(
                () => adminApi.setTier(question.id, answer.id, tier),
                tier === null ? `${answer.name}: override cleared.` : `${answer.name}: tier set.`,
              )
            }
            onRemove={() =>
              void act(
                () => adminApi.removeAnswer(question.id, answer.id),
                `${answer.name} removed.`,
              )
            }
          />
        ))}
      </ul>
    </div>
  );
}
