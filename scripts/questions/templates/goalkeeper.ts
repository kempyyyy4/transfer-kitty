import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { competition, competitionTag, CUP_IDS, groupIntoQuestions, LEAGUE_IDS } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  competition_id: string;
}

/** "Name a goalkeeper who has played in the Champions League since 2012/13." */
export const goalkeeper: Template = {
  key: "goalkeeper",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select a.competition_id, a.player_id, count(*) as context
      from tm_appearances a
      join tm_players p on p.player_id = a.player_id
      where p.position = 'Goalkeeper'
        and a.minutes_played > 0
        and a.competition_id in (${LEAGUE_IDS}, ${CUP_IDS})
      group by a.competition_id, a.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.careerAppearances, (row) => ({
      dedupeKey: `goalkeeper:${row.competition_id}`,
      templateKey: this.key,
      prompt: `Name a goalkeeper who has played in ${competition(row.competition_id).name} since ${FIRST_SEASON_LABEL}.`,
      params: { competitionId: row.competition_id },
      tags: [competitionTag(row.competition_id)],
    }));
  },
};
