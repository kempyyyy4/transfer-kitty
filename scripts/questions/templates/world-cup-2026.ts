import { FULL_INVOLVEMENT } from "@/config/fame";
import { groupIntoQuestions, slugify } from "../build";
import type { AnswerRow, Template } from "../types";

interface Row extends AnswerRow {
  team_id: number;
  team: string;
}

/**
 * "Name a player who played for Brazil in the group stage of the 2026 World Cup."
 * Group stage only: the dataset stops before the knockout rounds were recorded.
 */
export const worldCup2026: Template = {
  key: "world-cup-2026-group-stage",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      select a.player_club_id as team_id, n.name as team, a.player_id, count(*) as context
      from tm_appearances a
      join tm_games g on g.game_id = a.game_id
      join tm_national_teams n on n.national_team_id = a.player_club_id
      where g.competition_id = 'FIWC'
        and g.season = 2025
        and g.round like 'Group %'
      group by a.player_club_id, a.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.tournamentMatches, (row) => ({
      dedupeKey: `world-cup-2026-group-stage:${row.team_id}`,
      templateKey: this.key,
      prompt: `Name a player who played for ${row.team} in the group stage of the 2026 World Cup.`,
      params: { teamId: row.team_id },
      tags: [
        { type: "tournament", value: "world-cup-2026" },
        { type: "nationality", value: slugify(row.team) },
        { type: "decade", value: "2020s" },
      ],
    }));
  },
};
