import { FULL_INVOLVEMENT } from "@/config/fame";
import { groupIntoQuestions, LEAGUE_IDS, slugify } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  club_id: number;
  club_name: string;
}

/**
 * "Name a player who has played for Arsenal FC in the 2020s."
 * Only the 2020s: the match data starts in 2012, so the 2010s would be missing two seasons.
 */
export const clubDecade: Template = {
  key: "club-decade",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select a.player_club_id as club_id, c.name as club_name, a.player_id, count(*) as context
      from tm_appearances a
      join tm_clubs c on c.club_id = a.player_club_id
      where a.date >= '2020-01-01'
        and c.domestic_competition_id in (${LEAGUE_IDS})
      group by a.player_club_id, a.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.careerAppearances, (row) => ({
      dedupeKey: `club-decade:${row.club_id}:2020s`,
      templateKey: this.key,
      prompt: `Name a player who has played for ${row.club_name} in the 2020s.`,
      params: { clubId: row.club_id, decade: "2020s" },
      tags: [
        { type: "club", value: slugify(row.club_name) },
        { type: "decade", value: "2020s" },
      ],
    }));
  },
};
