import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { competition, competitionTag, groupIntoQuestions, LEAGUE_IDS } from "../build";
import type { AnswerRow, Template } from "../types";

const TARGETS = [8, 10, 15] as const;

interface Row extends AnswerRow {
  competition_id: string;
  target: number;
}

/** "Name a player who has made 10 or more assists in a single Premier League season since 2012/13." */
export const seasonAssists: Template = {
  key: "season-assists",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const targets = TARGETS.map((target) => `(${target})`).join(", ");
    const rows = warehouse.query<Row>(`
      with seasons as (
        select a.player_id, a.competition_id, g.season, sum(a.assists) as assists
        from tm_appearances a
        join tm_games g on g.game_id = a.game_id
        where a.competition_id in (${LEAGUE_IDS})
        group by a.player_id, a.competition_id, g.season
      ),
      targets (target) as (values ${targets})
      select s.competition_id, t.target, s.player_id, max(s.assists) as context
      from seasons s
      join targets t on s.assists >= t.target
      group by s.competition_id, t.target, s.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.seasonAssists, (row) => ({
      dedupeKey: `season-assists:${row.competition_id}:${row.target}`,
      templateKey: this.key,
      prompt: `Name a player who has made ${row.target} or more assists in a single ${competition(row.competition_id).name.replace(/^the /, "")} season since ${FIRST_SEASON_LABEL}.`,
      params: { competitionId: row.competition_id, target: row.target },
      tags: [competitionTag(row.competition_id)],
    }));
  },
};
