/**
 * Loads players, clubs and the generated questions into the Supabase project named in
 * .env.local. Run after "npm run questions:generate". Safe to re-run.
 */
import { readFileSync } from "node:fs";
import {
  countQuestions,
  getIdsByTransfermarktId,
  importQuestions,
  retireGeneratedQuestionsExcept,
  upsertClubs,
  upsertPlayers,
  type ClubImport,
  type PlayerImport,
  type QuestionImport,
} from "@/lib/db";
import { openWarehouse } from "../data/warehouse";
import { QUESTIONS_PATH } from "./paths";
import type { FinishedQuestion } from "./types";

function readPlayers(): PlayerImport[] {
  const warehouse = openWarehouse();
  const rows = warehouse.query<{
    player_id: number;
    wikidata_id: string | null;
    name: string;
    country: string | null;
    birth_year: number | null;
    position: string | null;
    fame: number;
  }>(`
    select p.player_id, p.wikidata_id, p.name, p.country, p.birth_year, p.position, f.fame
    from all_players p
    join player_fame f on f.player_id = p.player_id
  `);
  warehouse.close();

  return rows.map((row) => ({
    transfermarktId: row.player_id,
    wikidataId: row.wikidata_id,
    name: row.name,
    country: row.country,
    birthYear: row.birth_year,
    position: row.position,
    fameScore: row.fame,
  }));
}

function readClubs(): ClubImport[] {
  const warehouse = openWarehouse();
  const rows = warehouse.query<{ club_id: number; name: string; country: string | null }>(`
    select c.club_id, c.name, k.country_name as country
    from tm_clubs c
    left join tm_competitions k on k.competition_id = c.domestic_competition_id
  `);
  warehouse.close();

  return rows.map((row) => ({
    transfermarktId: row.club_id,
    name: row.name,
    country: row.country,
  }));
}

function toImport(question: FinishedQuestion, playerIds: Map<number, number>): QuestionImport {
  return {
    prompt: question.prompt,
    answerType: "player",
    dataSource: question.dataSource,
    templateKey: question.templateKey,
    templateParams: question.params,
    dedupeKey: question.dedupeKey,
    prominence: question.prominence,
    tags: question.tags,
    answers: question.answers.map((answer) => {
      const entityId = playerIds.get(answer.playerId);
      if (entityId === undefined) {
        throw new Error(`Player ${answer.playerId} in "${question.prompt}" is not in the database`);
      }
      return { entityId, tier: answer.tier, popularity: answer.popularity };
    }),
  };
}

const players = readPlayers();
await upsertPlayers(players);
console.log(`players: ${players.length} saved`);

const clubs = readClubs();
await upsertClubs(clubs);
console.log(`clubs: ${clubs.length} saved`);

const playerIds = await getIdsByTransfermarktId("players");
const questions = (JSON.parse(readFileSync(QUESTIONS_PATH, "utf8")) as FinishedQuestion[]).map(
  (question) => toImport(question, playerIds),
);

await importQuestions(questions, (imported) => {
  if (imported % 500 === 0 || imported === questions.length) {
    console.log(`questions: ${imported} of ${questions.length} imported`);
  }
});

// A question this run no longer produces is out of date, so it is taken out of play.
const retired = await retireGeneratedQuestionsExcept(
  new Set(questions.map((question) => question.dedupeKey)),
);
console.log(`questions: ${retired} out-of-date questions retired`);

const totals = await countQuestions();
console.log(
  `database now holds ${totals.activeQuestions} active questions and ${totals.answers} answers`,
);
