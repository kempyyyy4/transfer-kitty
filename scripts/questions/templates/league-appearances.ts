import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { competition, competitionTag, groupIntoQuestions, LEAGUE_IDS } from "../build";
import type { AnswerRow, Template } from "../types";

const TARGETS = [150, 200, 250, 300] as const;

interface Row extends AnswerRow {
  competition_id: string;
  target: number;
}

/**
 * "Name a player who has made 200 or more Premier League appearances since 2012/13." Only
 * games in the match data count, so the prompt always says which seasons.
 */
export const leagueAppearances: Template = {
  key: "league-appearances",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const targets = TARGETS.map((target) => `(${target})`).join(", ");
    const rows = warehouse.query<Row>(`
      with totals as (
        select player_id, competition_id, count(*) as games
        from tm_appearances
        where competition_id in (${LEAGUE_IDS})
        group by player_id, competition_id
      ),
      targets (target) as (values ${targets})
      select x.competition_id, t.target, x.player_id, x.games as context
      from totals x
      join targets t on x.games >= t.target
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.careerAppearances, (row) => ({
      dedupeKey: `league-appearances:${row.competition_id}:${row.target}`,
      templateKey: this.key,
      prompt: `Name a player who has made ${row.target} or more ${competition(row.competition_id).name.replace(/^the /, "")} appearances since ${FIRST_SEASON_LABEL}.`,
      params: { competitionId: row.competition_id, target: row.target },
      tags: [competitionTag(row.competition_id)],
    }));
  },
};
