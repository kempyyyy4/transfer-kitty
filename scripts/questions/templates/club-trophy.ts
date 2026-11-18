import { seasonLabel } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import type { Warehouse } from "../../data/warehouse";
import { competitionTag, groupIntoQuestions, LEAGUE_IDS, slugify } from "../build";
import type { AnswerRow, DraftQuestion, Template } from "../types";

/**
 * The trophies these questions ask about, and how to find each season's winner in the
 * match data. Tom chose these two on 18 November 2026.
 */
const TROPHIES = [
  {
    competitionId: "CL",
    name: "the Champions League",
    fullInvolvementAt: FULL_INVOLVEMENT.cupAppearances,
    // The final's winner. Shoot-out goals are included in the dataset's final score.
    winnersSql: `
      select season,
             case when home_club_goals > away_club_goals then home_club_id
                  when away_club_goals > home_club_goals then away_club_id end as club_id
      from tm_games
      where competition_id = 'CL' and round = 'Final'`,
  },
  {
    competitionId: "GB1",
    name: "the Premier League",
    fullInvolvementAt: FULL_INVOLVEMENT.seasonAppearances,
    // The table topper, on points then goal difference, for finished seasons only.
    winnersSql: `
      with results as (
        select season, home_club_id as club_id, home_club_goals - away_club_goals as gd
        from tm_games where competition_id = 'GB1' and home_club_goals is not null
        union all
        select season, away_club_id, away_club_goals - home_club_goals
        from tm_games where competition_id = 'GB1' and home_club_goals is not null
      ),
      tables as (
        select season, club_id,
               sum(case when gd > 0 then 3 when gd = 0 then 1 else 0 end) as points,
               sum(gd) as goal_difference, count(*) as played
        from results group by season, club_id
      ),
      ranked as (
        select *, row_number() over (
                    partition by season order by points desc, goal_difference desc) as place,
               sum(played) over (partition by season) as club_games
        from tables
      )
      select season, club_id from ranked where place = 1 and club_games = 760`,
  },
] as const;

interface Row extends AnswerRow {
  club_id: number;
  club_name: string;
}

/**
 * "Name a player who has played for Arsenal and won the Champions League between 2012/13
 * and 2024/25." A winner is anyone who played in that competition for the winning club
 * that season, from the match data, so every winner is on the list. The seasons are named
 * because the data only covers those: a final missing from the download simply moves the
 * end of the range back, rather than marking that season's winners wrong. "Played for" is
 * all-time, from the merged club histories, as in the two-club questions.
 */
export const clubTrophy: Template = {
  key: "club-trophy",
  dataSource: "transfermarkt+wikidata",
  generate(warehouse) {
    return TROPHIES.flatMap((trophy) => questionsFor(warehouse, trophy));
  },
};

function questionsFor(warehouse: Warehouse, trophy: (typeof TROPHIES)[number]): DraftQuestion[] {
  const range = warehouse.query<{ first: number | null; last: number | null }>(`
    select min(season) as first, max(season) as last
    from (${trophy.winnersSql}) where club_id is not null
  `)[0];
  if (!range?.first || !range.last) return [];
  const seasons = `between ${seasonLabel(range.first)} and ${seasonLabel(range.last)}`;

  const rows = warehouse.query<Row>(`
    with champions as (${trophy.winnersSql}),
    winners as (
      select a.player_id, count(*) as appearances
      from champions w
      join tm_games g on g.competition_id = '${trophy.competitionId}' and g.season = w.season
      join tm_appearances a on a.game_id = g.game_id and a.player_club_id = w.club_id
      where w.club_id is not null
      group by a.player_id
    )
    select s.club_id, c.name as club_name, w.player_id, w.appearances as context
    from winners w
    join (select distinct player_id, club_id from club_spells) s on s.player_id = w.player_id
    join tm_clubs c on c.club_id = s.club_id
    where c.domestic_competition_id in (${LEAGUE_IDS})
  `);

  return groupIntoQuestions(rows, trophy.fullInvolvementAt, (row) => ({
    dedupeKey: `club-trophy:${trophy.competitionId}:${row.club_id}`,
    templateKey: clubTrophy.key,
    prompt: `Name a player who has played for ${row.club_name} and won ${trophy.name} ${seasons}.`,
    params: { clubId: row.club_id, competitionId: trophy.competitionId },
    tags: [competitionTag(trophy.competitionId), { type: "club", value: slugify(row.club_name) }],
  }));
}
