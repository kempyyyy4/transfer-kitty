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
 * "Name a player who has played for both Liverpool FC and Real Madrid."
 * All-time: match data from 2012/13 onwards, Wikidata's club histories before then.
 */
export const twoClubs: Template = {
  key: "two-clubs",
  dataSource: "transfermarkt+wikidata",
  generate(warehouse) {
    // A player counts as involved only as far as their lesser club, hence min().
    const rows = warehouse.query<Row>(`
      with featured as (
        select s.player_id, s.club_id, c.name as club_name, s.games
        from club_spells s
        join tm_clubs c on c.club_id = s.club_id
        where c.domestic_competition_id in (${LEAGUE_IDS})
      )
      select a.club_id as first_id, a.club_name as first_name,
             b.club_id as second_id, b.club_name as second_name,
             a.player_id, min(a.games, b.games) as context
      from featured a
      join featured b on b.player_id = a.player_id and a.club_id < b.club_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.careerAppearances, (row) => ({
      dedupeKey: `two-clubs:${row.first_id}:${row.second_id}`,
      templateKey: this.key,
      prompt: `Name a player who has played for both ${row.first_name} and ${row.second_name}.`,
      params: { firstClubId: row.first_id, secondClubId: row.second_id },
      tags: [
        { type: "club", value: slugify(row.first_name) },
        { type: "club", value: slugify(row.second_name) },
      ],
    }));
  },
};
