import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import {
  competition,
  competitionTag,
  CUP_IDS,
  groupIntoQuestions,
  LEAGUE_IDS,
  slugify,
} from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  club_id: number;
  club_name: string;
  competition_id: string;
}

/** "Name a player who has played for Celtic FC in the Champions League since 2012/13." */
export const clubCup: Template = {
  key: "club-cup",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select s.club_id, c.name as club_name, s.competition_id,
             s.player_id, sum(s.appearances) as context
      from player_seasons s
      join tm_clubs c on c.club_id = s.club_id
      where s.competition_id in (${CUP_IDS})
        and c.domestic_competition_id in (${LEAGUE_IDS})
      group by s.club_id, s.competition_id, s.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.cupAppearances, (row) => ({
      dedupeKey: `club-cup:${row.club_id}:${row.competition_id}`,
      templateKey: this.key,
      prompt: `Name a player who has played for ${row.club_name} in ${competition(row.competition_id).name} since ${FIRST_SEASON_LABEL}.`,
      params: { clubId: row.club_id, competitionId: row.competition_id },
      tags: [competitionTag(row.competition_id), { type: "club", value: slugify(row.club_name) }],
    }));
  },
};
