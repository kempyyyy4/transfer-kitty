import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { SCORED_AGAINST_CLUBS } from "@/config/game";
import { competition, competitionTag, groupIntoQuestions, sqlList } from "../build";
import type { AnswerRow, Template } from "../types";

const COMPETITION_ID = "CL";

interface Row extends AnswerRow {
  opponent_id: number;
  opponent_name: string;
}

/** "Name a player who has scored against Real Madrid in the Champions League since 2012/13." */
export const scoredAgainst: Template = {
  key: "scored-against",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      with sides as (
        select game_id, home_club_id as club_id, away_club_id as opponent_id,
          away_club_name as opponent_name
        from tm_games where competition_id = '${COMPETITION_ID}'
        union all
        select game_id, away_club_id, home_club_id, home_club_name
        from tm_games where competition_id = '${COMPETITION_ID}'
      )
      select s.opponent_id, c.name as opponent_name, a.player_id, sum(a.goals) as context
      from sides s
      join tm_appearances a on a.game_id = s.game_id and a.player_club_id = s.club_id
      join tm_clubs c on c.club_id = s.opponent_id
      where a.goals > 0 and s.opponent_name in (${sqlList(SCORED_AGAINST_CLUBS)})
      group by s.opponent_id, a.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.fixtureGoals, (row) => ({
      dedupeKey: `scored-against:${COMPETITION_ID}:${row.opponent_id}`,
      templateKey: this.key,
      prompt: `Name a player who has scored against ${row.opponent_name} in ${competition(COMPETITION_ID).name} since ${FIRST_SEASON_LABEL}.`,
      params: { competitionId: COMPETITION_ID, opponentId: row.opponent_id },
      tags: [competitionTag(COMPETITION_ID)],
    }));
  },
};
