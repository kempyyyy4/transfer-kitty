import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { FIXTURE_CLUBS } from "@/config/game";
import { competition, competitionTag, groupIntoQuestions, sqlList } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  competition_id: string;
  first_id: number;
  second_id: number;
  first_name: string;
  second_name: string;
}

/**
 * "Name a player who has scored in a Premier League match between Arsenal and Tottenham
 * since 2012/13." The clubs are stored as teams, not `clubId`: a scorer need only have
 * played for one of them, so the weighting for time spent at a named club must not apply.
 */
export const fixtureScorer: Template = {
  key: "fixture-scorer",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const rows = Object.entries(FIXTURE_CLUBS).flatMap(([competitionId, clubs]) =>
      warehouse.query<Row>(`
        with games as (
          select game_id, competition_id,
            min(home_club_id, away_club_id) as first_id,
            max(home_club_id, away_club_id) as second_id
          from tm_games
          where competition_id = '${competitionId}'
            and home_club_name in (${sqlList(clubs)})
            and away_club_name in (${sqlList(clubs)})
        )
        select g.competition_id, g.first_id, g.second_id, a.player_id,
          sum(a.goals) as context,
          (select name from tm_clubs where club_id = g.first_id) as first_name,
          (select name from tm_clubs where club_id = g.second_id) as second_name
        from games g
        join tm_appearances a on a.game_id = g.game_id
        where a.goals > 0
        group by g.competition_id, g.first_id, g.second_id, a.player_id
      `),
    );

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.fixtureGoals, (row) => ({
      dedupeKey: `fixture-scorer:${row.competition_id}:${row.first_id}:${row.second_id}`,
      templateKey: this.key,
      prompt: `Name a player who has scored in a ${competition(row.competition_id).name.replace(/^the /, "")} match between ${row.first_name} and ${row.second_name} since ${FIRST_SEASON_LABEL}.`,
      params: {
        competitionId: row.competition_id,
        firstTeamId: row.first_id,
        secondTeamId: row.second_id,
      },
      tags: [competitionTag(row.competition_id)],
    }));
  },
};
