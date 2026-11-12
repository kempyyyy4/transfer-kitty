"use client";

import { useState } from "react";
import { GAME_RULES } from "@/config/game";
import { PlayerPicker, type PickablePlayer } from "@/components/PlayerPicker";
import { adminApi } from "../api-client";
import { ActionMessage, useAction } from "./use-action";

/**
 * Adds a hand-written question. Starting tiers come from each player's fame, the same
 * way as for generated questions, and can be overridden afterwards.
 */
export function NewQuestionPanel({ onCreated }: { onCreated: (id: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [players, setPlayers] = useState<PickablePlayer[]>([]);
  const { busy, message, run } = useAction();
  const chosen = new Set(players.map((player) => player.id));
  const needed = GAME_RULES.minAnswersPerQuestion;

  function save() {
    let createdId = "";
    void run(async () => {
      createdId = (
        await adminApi.createQuestion(
          prompt,
          status,
          players.map((player) => player.id),
        )
      ).id;
    }).then((ok) => {
      if (ok) onCreated(createdId);
    });
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <p className="text-chalk-dim">
        Only add facts you have checked against a trusted source. Every valid answer must be listed,
        or right answers will be marked wrong.
      </p>
      <label className="flex flex-col gap-1 text-lg text-chalk-dim">
        Question
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={200}
          className="pixel-input p-2"
        />
      </label>
      <select
        aria-label="Status when saved"
        value={status}
        onChange={(event) => setStatus(event.target.value === "active" ? "active" : "draft")}
        className="pixel-input self-start p-1 text-base"
      >
        <option value="draft">Save as draft</option>
        <option value="active">Save as active</option>
      </select>
      <PlayerPicker
        label="Add a valid answer"
        search={adminApi.searchPlayers}
        exclude={chosen}
        onPick={(player) => setPlayers([...players, player])}
      />
      <p className={players.length >= needed ? "text-turf-light" : "text-chalk-dim"}>
        {players.length} answers (at least {needed} needed)
      </p>
      <ul className="flex flex-col">
        {players.map((player) => (
          <li
            key={player.id}
            className="flex items-center justify-between gap-2 border-b-2 border-stand py-1"
          >
            <span>
              {player.name}
              {player.birthYear ? (
                <span className="text-chalk-dim"> · born {player.birthYear}</span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={() => setPlayers(players.filter((other) => other.id !== player.id))}
              className="pixel-button px-2 py-1 text-[10px]"
            >
              DROP
            </button>
          </li>
        ))}
      </ul>
      <button
        type="submit"
        disabled={busy || players.length < needed || prompt.trim().length < 10}
        className="pixel-button self-start px-3 py-2 text-[10px]"
      >
        SAVE QUESTION
      </button>
      <ActionMessage message={message} />
    </form>
  );
}
