import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { competition, competitionTag, CUP_IDS, groupIntoQuestions, LEAGUE_IDS } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  competition_id: string;
}

/** "Name a player who has scored a hat-trick in La Liga since 2012/13." */
export const hatTrick: Template = {
  key: "hat-trick",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select competition_id, player_id, count(*) as context
      from tm_appearances
      where goals >= 3
        and competition_id in (${LEAGUE_IDS}, ${CUP_IDS})
      group by competition_id, player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.hatTricks, (row) => ({
      dedupeKey: `hat-trick:${row.competition_id}`,
      templateKey: this.key,
      prompt: `Name a player who has scored a hat-trick in ${competition(row.competition_id).name} since ${FIRST_SEASON_LABEL}.`,
      params: { competitionId: row.competition_id },
      tags: [competitionTag(row.competition_id)],
    }));
  },
};
