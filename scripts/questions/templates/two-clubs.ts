import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { groupIntoQuestions, LEAGUE_IDS, slugify } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  first_id: number;
  first_name: string;
  second_id: number;
  second_name: string;
}

/**
 * "Name a player who has played for both Chelsea FC and Arsenal FC since 2012/13."
 * Built from match appearances only, so it covers 2012/13 onwards. The all-time version
 * of this question needs career data from before then.
 */
export const twoClubs: Template = {
  key: "two-clubs",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      with club_totals as (
        select s.player_id, s.club_id, c.name as club_name, sum(s.appearances) as appearances
        from player_seasons s
        join tm_clubs c on c.club_id = s.club_id
        where c.domestic_competition_id in (${LEAGUE_IDS})
        group by s.player_id, s.club_id
      )
      select a.club_id as first_id, a.club_name as first_name,
             b.club_id as second_id, b.club_name as second_name,
             a.player_id, min(a.appearances, b.appearances) as context
      from club_totals a
      join club_totals b on b.player_id = a.player_id and a.club_id < b.club_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.careerAppearances, (row) => ({
      dedupeKey: `two-clubs:${row.first_id}:${row.second_id}`,
      templateKey: this.key,
      prompt: `Name a player who has played for both ${row.first_name} and ${row.second_name} since ${FIRST_SEASON_LABEL}.`,
      params: { firstClubId: row.first_id, secondClubId: row.second_id },
      tags: [
        { type: "club", value: slugify(row.first_name) },
        { type: "club", value: slugify(row.second_name) },
      ],
    }));
  },
};
