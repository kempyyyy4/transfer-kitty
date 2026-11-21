import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { competition, competitionTag, groupIntoQuestions, LEAGUE_IDS } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  competition_id: string;
}

/** "Name a player who has scored in the Premier League as a teenager since 2012/13." */
export const teenScorer: Template = {
  key: "teen-scorer",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select a.competition_id, a.player_id, sum(a.goals) as context
      from tm_appearances a
      join tm_players p on p.player_id = a.player_id
      where a.goals > 0
        and a.competition_id in (${LEAGUE_IDS})
        and p.date_of_birth is not null
        and date(a.date) < date(p.date_of_birth, '+20 years')
      group by a.competition_id, a.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.goals, (row) => ({
      dedupeKey: `teen-scorer:${row.competition_id}`,
      templateKey: this.key,
      prompt: `Name a player who has scored in ${competition(row.competition_id).name} as a teenager since ${FIRST_SEASON_LABEL}.`,
      params: { competitionId: row.competition_id },
      tags: [competitionTag(row.competition_id)],
    }));
  },
};
