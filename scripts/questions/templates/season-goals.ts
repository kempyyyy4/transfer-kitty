import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { competition, competitionTag, groupIntoQuestions, LEAGUE_IDS } from "../build";
import type { AnswerRow, Template } from "../types";

const GOAL_TARGETS = [10, 15, 20] as const;

interface Row extends AnswerRow {
  competition_id: string;
  target: number;
}

/** "Name a player who has scored 20 or more goals in a single Premier League season since 2012/13." */
export const seasonGoals: Template = {
  key: "season-goals",
  generate(warehouse) {
    const targets = GOAL_TARGETS.map((target) => `(${target})`).join(", ");
    const rows = warehouse.query<Row>(`
      with league_seasons as (
        select player_id, competition_id, season, sum(goals) as goals
        from player_seasons
        where competition_id in (${LEAGUE_IDS})
        group by player_id, competition_id, season
      ),
      targets (target) as (values ${targets})
      select ls.competition_id, t.target, ls.player_id, max(ls.goals) as context
      from league_seasons ls
      join targets t on ls.goals >= t.target
      group by ls.competition_id, t.target, ls.player_id
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.seasonGoals, (row) => ({
      dedupeKey: `season-goals:${row.competition_id}:${row.target}`,
      templateKey: this.key,
      prompt: `Name a player who has scored ${row.target} or more goals in a single ${leagueAsAdjective(row.competition_id)} season since ${FIRST_SEASON_LABEL}.`,
      params: { competitionId: row.competition_id, target: row.target },
      tags: [competitionTag(row.competition_id)],
    }));
  },
};

/** "the Premier League" reads as "a single Premier League season". */
function leagueAsAdjective(competitionId: string): string {
  return competition(competitionId).name.replace(/^the /, "");
}
