"use client";

import { useState } from "react";
import { PlayerPicker } from "@/components/PlayerPicker";
import { gameApi } from "../api-client";

interface Props {
  sessionId: string;
  position: number;
  /** Already valid, so left out of the suggestions. */
  answerIds: ReadonlySet<number>;
}

/** After the round, a player can say someone right was missing from the list. */
export function ReportMissing({ sessionId, position, answerIds }: Props) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-lg text-chalk-dim underline hover:text-chalk"
      >
        Missing an answer? Tell us
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <PlayerPicker
        label="Who is missing?"
        search={gameApi.searchPlayers}
        exclude={answerIds}
        onPick={(player) => {
          setResult(null);
          gameApi
            .reportMissing(sessionId, position, player.id)
            .then((reply) => setResult(`${player.name}: ${reply.message}`))
            .catch((error: unknown) =>
              setResult(error instanceof Error ? error.message : "That did not send. Try again."),
            );
        }}
      />
      {result ? <p role="status">{result}</p> : null}
    </div>
  );
}
