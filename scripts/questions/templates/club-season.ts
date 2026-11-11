import { seasonLabel } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import {
  competition,
  competitionTag,
  decadeTags,
  groupIntoQuestions,
  LEAGUE_IDS,
  slugify,
} from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  club_id: number;
  club_name: string;
  competition_id: string;
  season: number;
}

/** "Name a player who played for Leicester City in the Premier League in 2015/16." */
export const clubSeason: Template = {
  key: "club-season",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select s.club_id, c.name as club_name, s.competition_id, s.season,
             s.player_id, s.appearances as context
      from player_seasons s
      join tm_clubs c on c.club_id = s.club_id
      where s.competition_id in (${LEAGUE_IDS})
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.seasonAppearances, (row) => {
      const league = competition(row.competition_id);
      const season = seasonLabel(row.season);
      return {
        dedupeKey: `club-season:${row.club_id}:${row.competition_id}:${row.season}`,
        templateKey: this.key,
        prompt: `Name a player who played for ${row.club_name} in ${league.name} in ${season}.`,
        params: { clubId: row.club_id, competitionId: row.competition_id, season: row.season },
        tags: [
          competitionTag(row.competition_id),
          { type: "club", value: slugify(row.club_name) },
          ...decadeTags(row.season, row.season + 1),
        ],
      };
    });
  },
};
