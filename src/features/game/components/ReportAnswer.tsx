"use client";

import { track } from "@/features/analytics";
import { useState } from "react";
import { PlayerPicker, type PickablePlayer } from "@/components/PlayerPicker";
import { toSearchName } from "@/lib/search-name";
import { gameApi } from "../api-client";
import type { ValidAnswer } from "../types";

interface Props {
  sessionId: string;
  position: number;
  /** The question's valid answers: left out when reporting a missing one, picked from when
   * reporting a wrong one. */
  answers: readonly ValidAnswer[];
}

type Kind = "missing" | "wrong";

/**
 * After the round, a player can report a right answer missing from the list, or a listed
 * answer that is wrong. Both are picked from lists, never typed as free text, and both
 * land in the admin's report queue.
 */
export function ReportAnswer({ sessionId, position, answers }: Props) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [result, setResult] = useState<string | null>(null);

  if (!kind) {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-lg">
        <button
          type="button"
          onClick={() => {
            track("report_opened", { kind: "missing" });
            setKind("missing");
          }}
          className="text-chalk-dim underline hover:text-chalk"
        >
          Missing an answer?
        </button>
        <button
          type="button"
          onClick={() => {
            track("report_opened", { kind: "wrong" });
            setKind("wrong");
          }}
          className="text-chalk-dim underline hover:text-chalk"
        >
          Report a wrong answer
        </button>
      </div>
    );
  }

  function report(player: PickablePlayer) {
    if (!kind) return;
    setResult(null);
    gameApi
      .reportAnswer(kind, sessionId, position, player.id)
      .then((reply) => setResult(`${player.name}: ${reply.message}`))
      .catch((error: unknown) =>
        setResult(error instanceof Error ? error.message : "That did not send. Try again."),
      );
  }

  return (
    <div className="flex flex-col gap-2">
      {kind === "missing" ? (
        <PlayerPicker
          label="Who is missing?"
          search={gameApi.searchPlayers}
          exclude={new Set(answers.map((answer) => answer.id))}
          onPick={report}
        />
      ) : (
        <PlayerPicker
          label="Which answer is wrong?"
          search={(query) => Promise.resolve(listedMatching(answers, query))}
          onPick={report}
        />
      )}
      {result ? <p role="status">{result}</p> : null}
      <button
        type="button"
        onClick={() => {
          setKind(null);
          setResult(null);
        }}
        className="self-start text-lg text-chalk-dim underline hover:text-chalk"
      >
        Close
      </button>
    </div>
  );
}

/** The listed answers whose names match what was typed, as picker suggestions. */
function listedMatching(answers: readonly ValidAnswer[], query: string): PickablePlayer[] {
  const wanted = toSearchName(query);
  return answers
    .filter((answer) => toSearchName(answer.name).includes(wanted))
    .slice(0, 8)
    .map((answer) => ({ id: answer.id, name: answer.name, birthYear: null, country: null }));
}
