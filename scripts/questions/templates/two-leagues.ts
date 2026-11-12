import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { competition, competitionTag, groupIntoQuestions, LEAGUE_IDS } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  first_id: string;
  second_id: string;
}

/** "Name a player who has played in both the Premier League and Serie A since 2012/13." */
export const twoLeagues: Template = {
  key: "two-leagues",
  dataSource: "transfermarkt",
  generate(warehouse) {
    // A player counts as involved only as far as their lesser league, hence min().
    const rows = warehouse.query<Row>(`
      with league_totals as (
        select player_id, competition_id, sum(appearances) as appearances
        from player_seasons
        where competition_id in (${LEAGUE_IDS})
        group by player_id, competition_id
      )
      select a.competition_id as first_id, b.competition_id as second_id,
             a.player_id, min(a.appearances, b.appearances) as context
      from league_totals a
      join league_totals b on b.player_id = a.player_id and a.competition_id < b.competition_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.careerAppearances, (row) => ({
      dedupeKey: `two-leagues:${row.first_id}:${row.second_id}`,
      templateKey: this.key,
      prompt: `Name a player who has played in both ${competition(row.first_id).name} and ${competition(row.second_id).name} since ${FIRST_SEASON_LABEL}.`,
      params: { firstCompetitionId: row.first_id, secondCompetitionId: row.second_id },
      tags: [competitionTag(row.first_id), competitionTag(row.second_id)],
    }));
  },
};
