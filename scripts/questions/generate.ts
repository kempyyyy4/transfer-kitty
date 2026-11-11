/**
 * Builds every question from the local warehouse and writes them to data/build.
 * Run after "npm run data:build". Loading into the database is a separate step:
 * "npm run questions:load".
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { GAME_RULES } from "@/config/game";
import { assignTiers } from "@/features/scoring";
import { openWarehouse } from "../data/warehouse";
import { QUESTIONS_PATH, REPORT_PATH } from "./paths";
import { startingPopularity } from "./popularity";
import { buildReport, type TemplateOutcome } from "./report";
import { TEMPLATES } from "./templates";
import type { DraftQuestion, FinishedQuestion } from "./types";

const warehouse = openWarehouse();

const fameByPlayer = new Map(
  warehouse
    .query<{ player_id: number; fame: number }>("select player_id, fame from player_fame")
    .map((row) => [row.player_id, row.fame]),
);

function finish(draft: DraftQuestion): FinishedQuestion {
  const tiered = assignTiers(
    draft.answers.map((answer) => ({
      entityId: answer.playerId,
      popularity: startingPopularity(fameByPlayer.get(answer.playerId) ?? 0, answer.involvement),
    })),
  );
  return {
    ...draft,
    answers: tiered.map(({ entityId, popularity, tier }) => ({
      playerId: entityId,
      popularity,
      tier,
    })),
  };
}

const finished: FinishedQuestion[] = [];
const outcomes: TemplateOutcome[] = [];

for (const template of TEMPLATES) {
  const drafts = template.generate(warehouse);
  const tooFew = drafts.filter((d) => d.answers.length < GAME_RULES.minAnswersPerQuestion);
  const tooMany = drafts.filter((d) => d.answers.length > GAME_RULES.maxAnswersPerQuestion);
  const kept = drafts
    .filter(
      (d) =>
        d.answers.length >= GAME_RULES.minAnswersPerQuestion &&
        d.answers.length <= GAME_RULES.maxAnswersPerQuestion,
    )
    .map(finish);

  finished.push(...kept);
  outcomes.push({
    templateKey: template.key,
    kept,
    tooFew: tooFew.length,
    tooMany: tooMany.length,
  });
  console.log(`${template.key}: kept ${kept.length} of ${drafts.length}`);
}

const duplicateKeys = finished.length - new Set(finished.map((q) => q.dedupeKey)).size;
if (duplicateKeys > 0) {
  throw new Error(`${duplicateKeys} questions share a dedupe key. Each key must be unique.`);
}

// A repeated player means a template merged rows it should not have, which would also
// give that player two tiers. Stop here so it is fixed in the template.
const repeated = finished.find(
  (q) => new Set(q.answers.map((answer) => answer.playerId)).size !== q.answers.length,
);
if (repeated) {
  throw new Error(`"${repeated.prompt}" lists the same player more than once.`);
}

const playerNames = new Map(
  warehouse
    .query<{ player_id: number; name: string }>("select player_id, name from tm_players")
    .map((row) => [row.player_id, row.name]),
);
warehouse.close();

mkdirSync(path.dirname(QUESTIONS_PATH), { recursive: true });
writeFileSync(QUESTIONS_PATH, JSON.stringify(finished));
const report = buildReport(outcomes, playerNames);
writeFileSync(REPORT_PATH, report);
console.log(`\n${report}`);
console.log(`Wrote ${finished.length} questions to ${QUESTIONS_PATH}`);
