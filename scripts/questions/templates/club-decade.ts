import { FULL_INVOLVEMENT } from "@/config/fame";
import { groupIntoQuestions, LEAGUE_IDS, slugify } from "../build";
import type { AnswerRow, DraftQuestion, Template } from "../types";
import type { Warehouse } from "../../data/warehouse";

/** The decades questions are written about. `current` only changes the wording. */
const DECADES = [
  { label: "1990s", from: 1990, to: 1999, current: false },
  { label: "2000s", from: 2000, to: 2009, current: false },
  { label: "2010s", from: 2010, to: 2019, current: false },
  { label: "2020s", from: 2020, to: 2029, current: true },
] as const;

type Decade = (typeof DECADES)[number];

interface Row extends AnswerRow {
  club_id: number;
  club_name: string;
}

/**
 * "Name a player who played for Arsenal FC in the 1990s."
 * Years from 2012/13 come from match dates. Earlier years come from Wikidata spells,
 * which need a start year to be placed in a decade.
 */
export const clubDecade: Template = {
  key: "club-decade",
  dataSource: "transfermarkt+wikidata",
  generate(warehouse) {
    return DECADES.flatMap((decade) => questionsForDecade(warehouse, decade, this.key));
  },
};

function questionsForDecade(
  warehouse: Warehouse,
  decade: Decade,
  templateKey: string,
): DraftQuestion[] {
  // Each source is totalled on its own, then the larger is kept: a spell that spans the
  // start of the match data is counted by both and must not be added together.
  const rows = warehouse.query<Row>(`
    with from_matches as (
      select player_id, club_id, sum(games) as games
      from tm_club_years
      where year between ${decade.from} and ${decade.to}
      group by player_id, club_id
    ),
    from_wikidata as (
      select player_id, club_id, max(coalesce(games, 0)) as games
      from wd_club_spells
      where start_year <= ${decade.to} and end_year >= ${decade.from}
      group by player_id, club_id
    ),
    either as (
      select * from from_matches
      union all
      select * from from_wikidata
    )
    select e.club_id, c.name as club_name, e.player_id, max(e.games) as context
    from either e
    join tm_clubs c on c.club_id = e.club_id
    where c.domestic_competition_id in (${LEAGUE_IDS})
    group by e.club_id, e.player_id
  `);

  const verb = decade.current ? "has played" : "played";
  return groupIntoQuestions(rows, FULL_INVOLVEMENT.careerAppearances, (row) => ({
    dedupeKey: `club-decade:${row.club_id}:${decade.label}`,
    templateKey,
    prompt: `Name a player who ${verb} for ${row.club_name} in the ${decade.label}.`,
    params: { clubId: row.club_id, decade: decade.label },
    tags: [
      { type: "club", value: slugify(row.club_name) },
      { type: "decade", value: decade.label },
    ],
  }));
}
