import { describe, expect, it } from "vitest";
import { pickDailyQuestions, type DailyCandidate } from "./pick-daily";

const LIMITS = { count: 7, maxPerTemplate: 2 };

function candidate(id: string, templateKey: string, ...clubIds: number[]): DailyCandidate {
  return { id, templateKey, clubIds };
}

/** Plenty of variety: ten templates, every question about a different club. */
function variedCandidates(count: number): DailyCandidate[] {
  return Array.from({ length: count }, (_, index) =>
    candidate(`q${index}`, `template-${index % 10}`, index),
  );
}

describe("pickDailyQuestions", () => {
  it("picks exactly the number asked for", () => {
    expect(pickDailyQuestions(variedCandidates(40), LIMITS)).toHaveLength(7);
  });

  it("takes candidates in the order given", () => {
    const picked = pickDailyQuestions(variedCandidates(40), LIMITS);

    expect(picked?.map((question) => question.id)).toEqual([
      "q0",
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
      "q6",
    ]);
  });

  it("never picks the same question twice", () => {
    const repeated = [...variedCandidates(5), ...variedCandidates(20)];
    const ids = pickDailyQuestions(repeated, LIMITS)?.map((question) => question.id) ?? [];

    expect(new Set(ids).size).toBe(7);
  });

  it("limits how many questions come from one template", () => {
    const mostlyOneTemplate = [
      ...Array.from({ length: 10 }, (_, index) => candidate(`a${index}`, "club-season", index)),
      ...Array.from({ length: 10 }, (_, index) =>
        candidate(`b${index}`, `other-${index}`, 100 + index),
      ),
    ];
    const picked = pickDailyQuestions(mostlyOneTemplate, LIMITS) ?? [];

    expect(picked.filter((question) => question.templateKey === "club-season")).toHaveLength(2);
  });

  it("does not ask about the same club twice in a day", () => {
    const sharedClub = [
      candidate("first", "two-clubs", 31, 418),
      candidate("second", "club-decade", 31),
      ...variedCandidates(20).map((question) => ({ ...question, id: `v-${question.id}` })),
    ];
    const ids = pickDailyQuestions(sharedClub, LIMITS)?.map((question) => question.id) ?? [];

    expect(ids).toContain("first");
    expect(ids).not.toContain("second");
  });

  it("allows a repeated club when there is no other way to fill the day", () => {
    const allOneClub = Array.from({ length: 7 }, (_, index) =>
      candidate(`q${index}`, `template-${index}`, 31),
    );

    expect(pickDailyQuestions(allOneClub, LIMITS)).toHaveLength(7);
  });

  it("allows one template to fill the day when nothing else is left", () => {
    const allOneTemplate = Array.from({ length: 7 }, (_, index) =>
      candidate(`q${index}`, "club-season", index),
    );

    expect(pickDailyQuestions(allOneTemplate, LIMITS)).toHaveLength(7);
  });

  it("returns null when there are too few candidates", () => {
    expect(pickDailyQuestions(variedCandidates(6), LIMITS)).toBeNull();
    expect(pickDailyQuestions([], LIMITS)).toBeNull();
  });
});
