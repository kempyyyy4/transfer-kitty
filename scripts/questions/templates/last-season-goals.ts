import { FULL_INVOLVEMENT } from "@/config/fame";
import { competition, competitionTag, groupIntoQuestions, LEAGUE_IDS, sqlList } from "../build";
import type { AnswerRow, Template } from "../types";

/** The latest full season in the data: 2025 means 2025/26. */
const SEASON = 2025;
const SEASON_LABEL = "2025/26";
const LEAGUE_TARGET = 10;
const TOP_FIVE_TARGET = 15;
const TOP_FIVE = sqlList(["GB1", "ES1", "IT1", "L1", "FR1"]);

interface Row extends AnswerRow {
  competition_id: string;
}

/**
 * "Name a player who scored 10 or more Premier League goals in 2025/26." One per league,
 * plus one for Europe's top five leagues together at 15 goals.
 */
export const lastSeasonGoals: Template = {
  key: "last-season-goals",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const perLeague = warehouse.query<Row>(`
      select competition_id, player_id, sum(goals) as context
      from player_seasons
      where season = ${SEASON} and competition_id in (${LEAGUE_IDS})
      group by competition_id, player_id
      having sum(goals) >= ${LEAGUE_TARGET}
    `);
    const topFive = warehouse.query<Row>(`
      select 'TOP5' as competition_id, player_id, max(goals) as context
      from (
        select player_id, competition_id, sum(goals) as goals
        from player_seasons
        where season = ${SEASON} and competition_id in (${TOP_FIVE})
        group by player_id, competition_id
      )
      group by player_id
      having max(goals) >= ${TOP_FIVE_TARGET}
    `);

    return groupIntoQuestions([...perLeague, ...topFive], FULL_INVOLVEMENT.seasonGoals, (row) => {
      const inTopFive = row.competition_id === "TOP5";
      const where = inTopFive
        ? `goals in one of Europe's top five leagues`
        : `${competition(row.competition_id).name.replace(/^the /, "")} goals`;
      const target = inTopFive ? TOP_FIVE_TARGET : LEAGUE_TARGET;
      return {
        dedupeKey: `last-season-goals:${row.competition_id}:${SEASON}`,
        templateKey: this.key,
        prompt: `Name a player who scored ${target} or more ${where} in ${SEASON_LABEL}.`,
        params: { competitionId: row.competition_id, season: SEASON, target },
        tags: inTopFive ? [] : [competitionTag(row.competition_id)],
      };
    });
  },
};
