import { describe, expect, it } from "vitest";
import { GAME_RULES } from "@/config/game";
import { buildManualQuestion } from "./manual-question";

const ids = Array.from({ length: GAME_RULES.minAnswersPerQuestion }, (_, i) => i + 1);
// Player 1 is the best known, the last player the least.
const fame = new Map(ids.map((id) => [id, 1000 - id * 10]));

describe("buildManualQuestion", () => {
  it("tiers the answers by fame, best known cheapest", () => {
    const outcome = buildManualQuestion(
      { prompt: "  A question?  ", status: "draft", playerIds: ids },
      fame,
    );
    if (outcome.status !== "ok") throw new Error(outcome.status);

    const tierOf = (id: number) => outcome.question.answers.find((a) => a.entityId === id)?.tier;
    expect(outcome.question.prompt).toBe("A question?");
    expect(tierOf(1)).toBe(1);
    expect(tierOf(ids.length)).toBe(7);
    expect(outcome.question.answers).toHaveLength(ids.length);
  });

  it("reads prominence from the third best-known answer", () => {
    const outcome = buildManualQuestion({ prompt: "Q", status: "active", playerIds: ids }, fame);
    expect(outcome.status === "ok" && outcome.question.prominence).toBe(fame.get(3));
  });

  it("refuses a player listed twice", () => {
    const outcome = buildManualQuestion(
      { prompt: "Q", status: "draft", playerIds: [...ids, 1] },
      fame,
    );
    expect(outcome.status).toBe("repeated_player");
  });

  it("refuses a player who is not in the database", () => {
    const outcome = buildManualQuestion(
      { prompt: "Q", status: "draft", playerIds: [...ids, 999] },
      fame,
    );
    expect(outcome.status).toBe("unknown_player");
  });

  it("refuses too few answers", () => {
    const outcome = buildManualQuestion(
      { prompt: "Q", status: "draft", playerIds: ids.slice(1) },
      fame,
    );
    expect(outcome.status).toBe("too_few");
  });
});
