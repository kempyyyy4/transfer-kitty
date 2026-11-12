"use client";

import { useState } from "react";
import { NewQuestionPanel } from "./NewQuestionPanel";
import { PacksPanel } from "./PacksPanel";
import { QuestionDetailPanel } from "./QuestionDetailPanel";
import { QuestionsPanel } from "./QuestionsPanel";
import { ReportsPanel } from "./ReportsPanel";
import { SchedulePanel } from "./SchedulePanel";
import { ShopPricesPanel } from "./ShopPricesPanel";

const TABS = [
  { key: "questions", label: "QUESTIONS" },
  { key: "new", label: "NEW QUESTION" },
  { key: "reports", label: "REPORTS" },
  { key: "packs", label: "PACKS" },
  { key: "schedule", label: "SCHEDULE" },
  { key: "shop", label: "SHOP PRICES" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function AdminTabs() {
  const [tab, setTab] = useState<Tab>("questions");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  function show(next: Tab) {
    setOpenQuestion(null);
    setTab(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-2" aria-label="Admin sections">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={tab === item.key && !openQuestion}
            onClick={() => show(item.key)}
            className={`pixel-button px-2 py-2 text-[10px] ${
              tab === item.key && !openQuestion ? "border-floodlight text-floodlight" : ""
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {openQuestion ? (
        <QuestionDetailPanel questionId={openQuestion} onBack={() => setOpenQuestion(null)} />
      ) : null}
      {!openQuestion && tab === "questions" ? <QuestionsPanel onOpen={setOpenQuestion} /> : null}
      {!openQuestion && tab === "new" ? <NewQuestionPanel onCreated={setOpenQuestion} /> : null}
      {!openQuestion && tab === "reports" ? <ReportsPanel onOpen={setOpenQuestion} /> : null}
      {!openQuestion && tab === "packs" ? <PacksPanel onOpen={setOpenQuestion} /> : null}
      {!openQuestion && tab === "schedule" ? <SchedulePanel onOpen={setOpenQuestion} /> : null}
      {!openQuestion && tab === "shop" ? <ShopPricesPanel /> : null}
    </div>
  );
}
