import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { groupIntoQuestions, LEAGUE_IDS, slugify } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  club_id: number;
  club_name: string;
}

/** "Name a player who has played a league match for Everton FC since 2012/13." */
export const clubSince2012: Template = {
  key: "club-since-2012",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select s.club_id, c.name as club_name, s.player_id, sum(s.appearances) as context
      from player_seasons s
      join tm_clubs c on c.club_id = s.club_id
      where s.competition_id in (${LEAGUE_IDS})
      group by s.club_id, s.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.careerAppearances, (row) => ({
      dedupeKey: `club-since-2012:${row.club_id}`,
      templateKey: this.key,
      prompt: `Name a player who has played a league match for ${row.club_name} since ${FIRST_SEASON_LABEL}.`,
      params: { clubId: row.club_id },
      tags: [{ type: "club", value: slugify(row.club_name) }],
    }));
  },
};
