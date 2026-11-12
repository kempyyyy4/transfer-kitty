import { WIKIDATA_RULES } from "@/config/wikidata";
import type { Warehouse } from "../warehouse";

/**
 * Who played for which club, all-time, from both sources.
 * Transfermarkt's matches cover 2012/13 onwards; Wikidata's spells cover what came before.
 */
export function buildClubSpells(warehouse: Warehouse): void {
  const rules = WIKIDATA_RULES;
  const gamesRule = rules.acceptSpellsWithoutGameCount
    ? `(w.appearances is null or w.appearances >= ${rules.minRecordedGames})`
    : `w.appearances >= ${rules.minRecordedGames}`;

  warehouse.run(`
    -- Calendar years in which a player appeared for a club, from match data.
    drop table if exists tm_club_years;
    create table tm_club_years as
    select a.player_id, a.player_club_id as club_id,
           cast(substr(a.date, 1, 4) as integer) as year, count(*) as games
    from tm_appearances a
    join tm_clubs c on c.club_id = a.player_club_id
    group by a.player_id, a.player_club_id, year;
    create index tm_club_years_by_club on tm_club_years (club_id, year);

    -- Wikidata spells that pass the rules in src/config/wikidata.ts. An undated spell is
    -- used only when it must predate the match data: it ended by then, or the player
    -- never appears in the match data at all.
    -- end_year stops at the last year Wikidata is trusted for; later years come from matches.
    drop table if exists wd_club_spells;
    create table wd_club_spells as
    select w.player_tm_id as player_id, w.team_tm_id as club_id, w.start_year,
           min(coalesce(w.end_year, w.start_year), ${rules.lastStartYear}) as end_year,
           w.appearances as games
    from wd_careers w
    join tm_clubs c on c.club_id = w.team_tm_id
    join all_players a on a.player_id = w.player_tm_id
    where ${gamesRule}
      and (
        w.start_year <= ${rules.lastStartYear}
        or (w.start_year is null
            and (w.end_year <= ${rules.lastStartYear} or a.in_transfermarkt = 0))
      );
    create index wd_club_spells_by_club on wd_club_spells (club_id, start_year);

    -- One row per player and club, whichever source knows about it.
    drop table if exists club_spells;
    create table club_spells as
    select player_id, club_id, max(games) as games, max(from_wikidata) as from_wikidata
    from (
      select player_id, club_id, sum(games) as games, 0 as from_wikidata
      from tm_club_years
      group by player_id, club_id
      union all
      select player_id, club_id, sum(coalesce(games, 0)), 1
      from wd_club_spells
      group by player_id, club_id
    )
    group by player_id, club_id;
    create index club_spells_by_player on club_spells (player_id);
    create index club_spells_by_club on club_spells (club_id);
  `);
}
