import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { countryName, groupIntoQuestions, LEAGUE_IDS, slugify } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  club_id: number;
  club_name: string;
  country: string;
}

/** "Name a player from Brazil who has played for Real Madrid since 2012/13." */
export const nationalityClub: Template = {
  key: "nationality-club",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select s.club_id, c.name as club_name, p.country_of_citizenship as country,
             s.player_id, sum(s.appearances) as context
      from player_seasons s
      join tm_clubs c on c.club_id = s.club_id
      join tm_players p on p.player_id = s.player_id
      where c.domestic_competition_id in (${LEAGUE_IDS})
        and p.country_of_citizenship is not null
      group by s.club_id, p.country_of_citizenship, s.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.careerAppearances, (row) => {
      const country = countryName(row.country);
      return {
        dedupeKey: `nationality-club:${row.club_id}:${slugify(row.country)}`,
        templateKey: this.key,
        prompt: `Name a player from ${country} who has played for ${row.club_name} since ${FIRST_SEASON_LABEL}.`,
        params: { clubId: row.club_id, country },
        tags: [
          { type: "club", value: slugify(row.club_name) },
          { type: "nationality", value: slugify(country) },
        ],
      };
    });
  },
};
