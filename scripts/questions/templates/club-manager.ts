import { seasonLabel } from "@/config/competitions";
import { FULL_INVOLVEMENT } from "@/config/fame";
import { decadeTags, groupIntoQuestions, LEAGUE_IDS, slugify } from "../build";
import type { AnswerRow, DraftQuestion, Template } from "../types";

/** Fewer matches than this is a caretaker spell, which nobody could be expected to recall. */
const MIN_MATCHES_IN_CHARGE = 20;

interface Row extends AnswerRow {
  club_id: number;
  club_name: string;
  manager: string;
  /** Matches this spelling of the manager's name was in charge of the club for. */
  matches: number;
  first_season: number;
  last_season: number;
}

/**
 * "Name a player who played for Chelsea FC under José Mourinho between 2013/14 and 2015/16."
 * The seasons are spelled out because the data starts in 2012/13: without them, a manager's
 * earlier spell at the same club would make correct answers look wrong.
 */
export const clubManager: Template = {
  key: "club-manager",
  generate(warehouse) {
    const rows = warehouse.query<Row>(`
      with spells as (
        select cg.club_id, cg.own_manager_name as manager, count(*) as matches,
               min(g.season) as first_season, max(g.season) as last_season
        from tm_club_games cg
        join tm_games g on g.game_id = cg.game_id
        join tm_clubs c on c.club_id = cg.club_id
        where cg.own_manager_name is not null
          and c.domestic_competition_id in (${LEAGUE_IDS})
        group by cg.club_id, cg.own_manager_name
      )
      select sp.club_id, c.name as club_name, sp.manager, sp.matches,
             sp.first_season, sp.last_season, a.player_id, count(*) as context
      from spells sp
      join tm_clubs c on c.club_id = sp.club_id
      join tm_club_games cg on cg.club_id = sp.club_id and cg.own_manager_name = sp.manager
      join tm_appearances a on a.game_id = cg.game_id and a.player_club_id = cg.club_id
      group by sp.club_id, sp.manager, a.player_id
    `);

    // The data sometimes spells one manager two ways ("Génésio", "Genesio"), so spells at
    // the same club are merged when the names match once accents are removed.
    const spells = Map.groupBy(rows, (row) => `${row.club_id}:${slugify(row.manager)}`);
    return [...spells.values()].flatMap((spellRows) => questionForSpell(spellRows, this.key));
  },
};

function questionForSpell(spellRows: Row[], templateKey: string): DraftQuestion[] {
  // One row per spelling is enough: every row of a spelling carries the same match count.
  const spellings = [...Map.groupBy(spellRows, (row) => row.manager).values()].flatMap((rows) =>
    rows.slice(0, 1),
  );
  const matches = spellings.reduce((sum, spelling) => sum + spelling.matches, 0);
  if (matches < MIN_MATCHES_IN_CHARGE) return [];

  const mostUsed = spellings.reduce((a, b) => (b.matches > a.matches ? b : a));
  const spell = {
    ...mostUsed,
    first_season: Math.min(...spellings.map((spelling) => spelling.first_season)),
    last_season: Math.max(...spellings.map((spelling) => spelling.last_season)),
  };

  const appearances = new Map<number, number>();
  for (const row of spellRows) {
    appearances.set(row.player_id, (appearances.get(row.player_id) ?? 0) + row.context);
  }
  const merged = [...appearances].map(([player_id, context]) => ({ ...spell, player_id, context }));

  return groupIntoQuestions(merged, FULL_INVOLVEMENT.careerAppearances, (row) => ({
    dedupeKey: `club-manager:${row.club_id}:${slugify(row.manager)}`,
    templateKey,
    prompt: `Name a player who played for ${row.club_name} under ${row.manager} ${seasonSpan(row)}.`,
    params: {
      clubId: row.club_id,
      manager: row.manager,
      firstSeason: row.first_season,
      lastSeason: row.last_season,
    },
    tags: [
      { type: "club", value: slugify(row.club_name) },
      ...decadeTags(row.first_season, row.last_season + 1),
    ],
  }));
}

function seasonSpan(row: Row): string {
  return row.first_season === row.last_season
    ? `in ${seasonLabel(row.first_season)}`
    : `between ${seasonLabel(row.first_season)} and ${seasonLabel(row.last_season)}`;
}
