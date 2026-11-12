import { FULL_INVOLVEMENT } from "@/config/fame";
import { competition, competitionTag, CUP_IDS, groupIntoQuestions } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  competition_id: string;
  first_year: number;
}

/** "Name a player who has played in the FA Cup final since 2013." */
export const cupFinalist: Template = {
  key: "cup-finalist",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      with finals as (
        select game_id, competition_id, cast(substr(date, 1, 4) as integer) as year
        from tm_games
        where round = 'Final' and competition_id in (${CUP_IDS})
      )
      select f.competition_id,
             (select min(year) from finals where competition_id = f.competition_id) as first_year,
             a.player_id, count(*) as context
      from finals f
      join tm_appearances a on a.game_id = f.game_id
      group by f.competition_id, a.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.finals, (row) => ({
      dedupeKey: `cup-finalist:${row.competition_id}`,
      templateKey: this.key,
      prompt: `Name a player who has played in ${competition(row.competition_id).name} final since ${row.first_year}.`,
      params: { competitionId: row.competition_id, firstYear: row.first_year },
      tags: [competitionTag(row.competition_id)],
    }));
  },
};
