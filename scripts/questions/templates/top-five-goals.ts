import { FIRST_SEASON_LABEL } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { groupIntoQuestions, sqlList } from "../build";
import type { AnswerRow, Template } from "../types";

const TARGETS = [100, 150] as const;
const TOP_FIVE = sqlList(["GB1", "ES1", "IT1", "L1", "FR1"]);

interface Row extends AnswerRow {
  target: number;
}

/**
 * "Name a player who has scored 100 or more goals in Europe's top five leagues since
 * 2012/13." The match data starts in 2012/13, so a whole-career total would wrongly turn
 * away players whose earlier goals are missing; the prompt says which seasons count.
 */
export const topFiveGoals: Template = {
  key: "top-five-goals",
  dataSource: "transfermarkt",
  generate(warehouse) {
    const targets = TARGETS.map((target) => `(${target})`).join(", ");
    const rows = warehouse.query<Row>(`
      with totals as (
        select player_id, sum(goals) as goals
        from player_seasons
        where competition_id in (${TOP_FIVE})
        group by player_id
      ),
      targets (target) as (values ${targets})
      select t.target, s.player_id, s.goals as context
      from totals s
      join targets t on s.goals >= t.target
    `);

    return groupIntoQuestions(rows, FULL_INVOLVEMENT.seasonGoals * 6, (row) => ({
      dedupeKey: `top-five-goals:${row.target}`,
      templateKey: this.key,
      prompt: `Name a player who has scored ${row.target} or more goals in Europe's top five leagues since ${FIRST_SEASON_LABEL}.`,
      params: { target: row.target },
      tags: [],
    }));
  },
};
