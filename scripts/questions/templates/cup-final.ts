import { FULL_INVOLVEMENT } from "@/config/fame";
import { competition, competitionTag, CUP_IDS, decadeTags, groupIntoQuestions } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  game_id: number;
  competition_id: string;
  year: number;
  home: string;
  away: string;
}

/** "Name a player who played in the 2019 Champions League final (Tottenham Hotspur v Liverpool FC)." */
export const cupFinal: Template = {
  key: "cup-final",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select g.game_id, g.competition_id, cast(substr(g.date, 1, 4) as integer) as year,
             g.home_club_name as home, g.away_club_name as away,
             a.player_id, coalesce(a.minutes_played, 0) as context
      from tm_games g
      join tm_appearances a on a.game_id = g.game_id
      where g.round = 'Final'
        and g.competition_id in (${CUP_IDS})
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.matchMinutes, (row) => {
      // "the Champions League" reads as "the 2019 Champions League final" inside the prompt.
      const cup = competition(row.competition_id).name.replace(/^the /, "");
      return {
        dedupeKey: `cup-final:${row.game_id}`,
        templateKey: this.key,
        prompt: `Name a player who played in the ${row.year} ${cup} final (${row.home} v ${row.away}).`,
        params: { gameId: row.game_id, competitionId: row.competition_id, year: row.year },
        tags: [competitionTag(row.competition_id), ...decadeTags(row.year, row.year)],
      };
    });
  },
};
