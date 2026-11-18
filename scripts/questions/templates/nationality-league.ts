import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import {
  competition,
  competitionTag,
  countryName,
  groupIntoQuestions,
  LEAGUE_IDS,
  slugify,
} from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  competition_id: string;
  country: string;
}

/**
 * "Name a player from Senegal who has played in the Premier League since 2012/13."
 * Nationality is the first citizenship the dataset lists, under one spelling per country,
 * or Wikidata's where the dataset is blank (see player_nationality).
 */
export const nationalityLeague: Template = {
  key: "nationality-league",
  dataSource: "transfermarkt+wikidata",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select s.competition_id, n.country,
             s.player_id, sum(s.appearances) as context
      from player_seasons s
      join player_nationality n on n.player_id = s.player_id
      where s.competition_id in (${LEAGUE_IDS})
      group by s.competition_id, n.country, s.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.careerAppearances, (row) => {
      const league = competition(row.competition_id);
      const country = countryName(row.country);
      return {
        dedupeKey: `nationality-league:${row.competition_id}:${slugify(row.country)}`,
        templateKey: this.key,
        prompt: `Name a player from ${country} who has played in ${league.name} since ${FIRST_SEASON_LABEL}.`,
        params: { competitionId: row.competition_id, country },
        tags: [
          competitionTag(row.competition_id),
          { type: "nationality", value: slugify(country) },
        ],
      };
    });
  },
};
