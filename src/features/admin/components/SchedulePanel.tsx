"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { adminApi } from "../api-client";
import type { UpcomingPuzzle } from "../types";

/** The coming days' puzzles, so the admin can check questions before they go live. */
export function SchedulePanel({ onOpen }: { onOpen: (id: string) => void }) {
  const [days, setDays] = useState<UpcomingPuzzle[] | null>(null);

  useEffect(() => {
    adminApi
      .schedule()
      .then(setDays)
      .catch(() => setDays([]));
  }, []);

  if (!days) return <Loader />;
  if (days.length === 0) return <p>No puzzles are scheduled.</p>;

  return (
    <ol className="flex flex-col gap-3">
      {days.map((day) => (
        <li key={day.date} className="pixel-panel flex flex-col gap-1 p-2">
          <p className="font-pixel text-[10px] text-floodlight">
            #{day.number} · {day.date}
          </p>
          <ol className="flex flex-col">
            {day.questions.map((question, index) => (
              <li key={question.id}>
                <button
                  type="button"
                  onClick={() => onOpen(question.id)}
                  className="text-left hover:text-floodlight"
                >
                  {index + 1}. {question.prompt}
                  {question.source === "manual" ? " (hand-written)" : ""}
                </button>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
