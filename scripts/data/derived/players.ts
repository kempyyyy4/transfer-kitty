import type { Warehouse } from "../warehouse";

/**
 * The full player list: everyone in Transfermarkt's dataset, plus players who are only
 * in Wikidata (mostly those who retired before 2012). Every Wikidata player downloaded
 * has a Transfermarkt ID, so that ID identifies a player in both sources.
 */
export function buildAllPlayers(warehouse: Warehouse): void {
  warehouse.run(`
    -- One Wikidata entry per player. Wikidata occasionally has two entries for one
    -- Transfermarkt ID, or one entry carrying two IDs.
    drop table if exists wd_players;
    create table wd_players as
    with named as (
      select player_tm_id as player_id, player_qid as qid, name, birth_year, sitelinks,
             row_number() over (
               partition by player_qid
               order by (player_tm_id in (select player_id from tm_players)) desc, player_tm_id
             ) as rank_in_entry
      from wd_profiles
      where name is not null
    ),
    ranked as (
      select *, row_number() over (partition by player_id order by sitelinks desc, qid)
                  as rank_for_player
      from named
      where rank_in_entry = 1
    )
    select player_id, qid, name, birth_year, sitelinks
    from ranked
    where rank_for_player = 1;
    create unique index wd_players_by_player on wd_players (player_id);

    drop table if exists all_players;
    create table all_players as
    select p.player_id, w.qid as wikidata_id, p.name, p.country_of_citizenship as country,
           cast(substr(p.date_of_birth, 1, 4) as integer) as birth_year, p.position,
           coalesce(w.sitelinks, 0) as sitelinks, 1 as in_transfermarkt
    from tm_players p
    left join wd_players w on w.player_id = p.player_id
    where p.name is not null
    union all
    -- Wikidata-only players are kept only if Wikidata records a club for them.
    select w.player_id, w.qid, w.name, null, w.birth_year, null, w.sitelinks, 0
    from wd_players w
    where not exists (select 1 from tm_players p where p.player_id = w.player_id)
      and exists (select 1 from wd_careers c where c.player_tm_id = w.player_id);
    create unique index all_players_by_player on all_players (player_id);
  `);
}
