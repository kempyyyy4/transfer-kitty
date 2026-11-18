/**
 * Builds every question from the local warehouse and writes them to data/build.
 * Run after "npm run data:build". Loading into the database is a separate step:
 * "npm run questions:load".
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CLUB_SHORT_NAMES } from "@/config/competitions";
import { CLUB_ASSOCIATION } from "@/config/fame";
import { DAILY_CLUBS, DAILY_PUZZLE, GAME_RULES } from "@/config/game";
import { assignTiers } from "@/features/scoring";
import { openWarehouse } from "../data/warehouse";
import { QUESTIONS_PATH, REPORT_PATH } from "./paths";
import { startingPopularity } from "./popularity";
import { buildReport, type TemplateOutcome } from "./report";
import { TEMPLATES } from "./templates";
import type { DataSource, DraftQuestion, FinishedQuestion } from "./types";

const warehouse = openWarehouse();

const fameByPlayer = new Map(
  warehouse
    .query<{ player_id: number; fame: number }>("select player_id, fame from player_fame")
    .map((row) => [row.player_id, row.fame]),
);

/** Each player's club in the latest season of league data: who they play for now. */
const currentClub = new Map(
  warehouse
    .query<{ player_id: number; club_id: number }>(
      `with latest as (
         select s.player_id, s.club_id,
                row_number() over (partition by s.player_id
                                   order by s.season desc, s.appearances desc) as r
         from player_seasons s
         join tm_competitions c on c.competition_id = s.competition_id
         where c.type = 'domestic_league'
           and s.season = (select max(season) from player_seasons)
       )
       select player_id, club_id from latest where r = 1`,
    )
    .map((row) => [row.player_id, row.club_id]),
);

/** Games per player at each club, and over the whole career, from the merged club histories. */
const clubGames = new Map<string, number>();
const careerGames = new Map<number, number>();
for (const row of warehouse.query<{ player_id: number; club_id: number; games: number }>(
  "select player_id, club_id, sum(coalesce(games, 0)) as games from club_spells group by 1, 2",
)) {
  clubGames.set(`${row.player_id}:${row.club_id}`, row.games);
  careerGames.set(row.player_id, (careerGames.get(row.player_id) ?? 0) + row.games);
}

/** Every club that has played in the Premier League since the match data starts. */
const premierLeagueClubs = new Set(
  warehouse
    .query<{ club_id: number }>(
      "select distinct club_id from player_seasons where competition_id = 'GB1'",
    )
    .map((row) => row.club_id),
);

/** Other clubs from best known down, by the fame of their 25 best-known players. */
const otherClubRank = new Map(
  warehouse
    .query<{ club_id: number }>(
      `with ranked as (
         select cs.club_id, f.fame,
                row_number() over (partition by cs.club_id order by f.fame desc) as r
         from (select distinct player_id, club_id from club_spells) cs
         join player_fame f on f.player_id = cs.player_id
       )
       select club_id from ranked where r <= 25
       group by club_id order by sum(fame) desc`,
    )
    .filter((row) => !premierLeagueClubs.has(row.club_id))
    .map((row, index) => [row.club_id, index + 1]),
);

/**
 * Whether a question is fair for the daily: every club it names is well known, and a
 * question about one final's line-ups is about a final most fans watch.
 */
function fairForDaily(draft: DraftQuestion): boolean {
  const finals = DAILY_CLUBS.finalCompetitions as readonly string[];
  if (draft.templateKey === "cup-final" && !finals.includes(String(draft.params.competitionId))) {
    return false;
  }
  return clubsWellKnown(draft);
}

/** The clubs a question names, if any. */
function clubIdsOf(draft: DraftQuestion): number[] {
  return [draft.params.clubId, draft.params.firstClubId, draft.params.secondClubId]
    .filter((id) => id !== undefined)
    .map(Number);
}

/**
 * How involved a player counts as in a question that names clubs: fully if he plays for
 * one of them now, and less if his spell there was a small part of a long career. See
 * CLUB_ASSOCIATION in src/config/fame.ts.
 */
function clubInvolvement(
  clubIds: readonly number[],
  playerId: number,
  involvement: number,
): number {
  if (clubIds.length === 0) return involvement;
  if (clubIds.includes(currentClub.get(playerId) ?? -1)) return 1;
  const career = careerGames.get(playerId) ?? 0;
  if (career === 0) return involvement;
  const shares = clubIds.map((clubId) =>
    Math.min(
      1,
      (clubGames.get(`${playerId}:${clubId}`) ?? 0) /
        (CLUB_ASSOCIATION.careerShareForFull * career),
    ),
  );
  return involvement * Math.min(...shares);
}

/** Whether every club a question names is one most fans know. */
function clubsWellKnown(draft: DraftQuestion): boolean {
  return clubIdsOf(draft).every(
    (id) =>
      premierLeagueClubs.has(id) ||
      (otherClubRank.get(id) ?? Infinity) <= DAILY_CLUBS.topOtherClubs,
  );
}

/** The prompt with long official club names swapped for the names fans use. */
function withShortClubNames(prompt: string): string {
  return Object.entries(CLUB_SHORT_NAMES).reduce(
    (text, [official, short]) => text.replaceAll(official, short),
    prompt,
  );
}

function finish(draft: DraftQuestion, dataSource: DataSource): FinishedQuestion {
  const clubIds = clubIdsOf(draft);
  const tiered = assignTiers(
    draft.answers.map((answer) => ({
      entityId: answer.playerId,
      popularity: startingPopularity(
        fameByPlayer.get(answer.playerId) ?? 0,
        clubInvolvement(clubIds, answer.playerId, answer.involvement),
      ),
    })),
  );
  return {
    ...draft,
    prompt: withShortClubNames(draft.prompt),
    dataSource,
    // An unfair question gets prominence 0: never in the daily, and never in Unlimited.
    prominence: fairForDaily(draft)
      ? (tiered[DAILY_PUZZLE.prominenceAnswerRank]?.popularity ?? 0)
      : 0,
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
    .map((draft) => finish(draft, template.dataSource));

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
    .query<{ player_id: number; name: string }>("select player_id, name from all_players")
    .map((row) => [row.player_id, row.name]),
);
warehouse.close();

mkdirSync(path.dirname(QUESTIONS_PATH), { recursive: true });
writeFileSync(QUESTIONS_PATH, JSON.stringify(finished));
const report = buildReport(outcomes, playerNames);
writeFileSync(REPORT_PATH, report);
console.log(`\n${report}`);
console.log(`Wrote ${finished.length} questions to ${QUESTIONS_PATH}`);
