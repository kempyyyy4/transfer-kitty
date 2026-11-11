/**
 * Measures how well Wikidata's club histories agree with Transfermarkt's match data,
 * for the players and seasons both cover. Tom decides from these numbers whether
 * Wikidata is accurate enough to build older-era questions on.
 * npm run wikidata:compare     Run after "npm run wikidata:download".
 */
import { writeFileSync } from "node:fs";
import { FEATURED_LEAGUES, FIRST_SEASON } from "@/config/competitions";
import { loadWikidataCareers } from "./load-wikidata";
import { WIKIDATA_REPORT_PATH } from "./sources";
import { openWarehouse, type Warehouse } from "./warehouse";

/** A spell this long at a club is one any complete career record should include. */
const ESTABLISHED_LEAGUE_APPEARANCES = 10;
/** Wikidata spells with fewer recorded matches are too slight to judge it on. */
const MEANINGFUL_WIKIDATA_APPEARANCES = 5;

const LEAGUES = FEATURED_LEAGUES.map((league) => `'${league.id}'`).join(", ");

function buildComparisonTables(warehouse: Warehouse): void {
  warehouse.run(`
    -- Every player and club pairing Transfermarkt has league appearances for.
    drop table if exists cmp_tm_spells;
    create table cmp_tm_spells as
    select s.player_id, s.club_id, sum(s.appearances) as appearances,
           min(s.season) as first_season
    from player_seasons s
    join tm_clubs c on c.club_id = s.club_id
    where s.competition_id in (${LEAGUES})
    group by s.player_id, s.club_id;
    create index cmp_tm_spells_key on cmp_tm_spells (player_id, club_id);

    -- Clubs in a featured league in every season of the data. Only for these is a missing
    -- Transfermarkt appearance real evidence that Wikidata is wrong.
    drop table if exists cmp_ever_present_clubs;
    create table cmp_ever_present_clubs as
    select club_id
    from player_seasons
    where competition_id in (${LEAGUES})
    group by club_id
    having count(distinct season) = (select count(distinct season) from player_seasons
                                     where competition_id in (${LEAGUES}));
  `);
}

function single(warehouse: Warehouse, sql: string): number {
  const [row] = warehouse.query<{ value: number }>(sql);
  return row?.value ?? 0;
}

function percent(part: number, whole: number): string {
  return whole === 0 ? "n/a" : `${((100 * part) / whole).toFixed(1)}%`;
}

function line(label: string, part: number, whole: number): string {
  return `${label}: ${part.toLocaleString("en-GB")} of ${whole.toLocaleString("en-GB")} (${percent(part, whole)})`;
}

function buildReport(warehouse: Warehouse, spellCount: number): string {
  const established = `appearances >= ${ESTABLISHED_LEAGUE_APPEARANCES}`;
  const inWikidata = "player_id in (select player_tm_id from wd_careers)";
  const spellFound = `exists (select 1 from wd_careers w
                              where w.player_tm_id = t.player_id and w.team_tm_id = t.club_id)`;

  const players = single(warehouse, "select count(*) as value from tm_players");
  const playersFound = single(
    warehouse,
    `select count(*) as value from tm_players where ${inWikidata}`,
  );
  const establishedSpells = single(
    warehouse,
    `select count(*) as value from cmp_tm_spells where ${established}`,
  );
  const establishedFound = single(
    warehouse,
    `select count(*) as value from cmp_tm_spells t where ${established} and ${spellFound}`,
  );
  const establishedKnownPlayers = single(
    warehouse,
    `select count(*) as value from cmp_tm_spells where ${established} and ${inWikidata}`,
  );

  // Wikidata spells that began inside the data window at an ever-present club.
  const checkable = `from wd_careers w
    join tm_players p on p.player_id = w.player_tm_id
    join cmp_ever_present_clubs c on c.club_id = w.team_tm_id
    where w.start_year > ${FIRST_SEASON}
      and w.appearances >= ${MEANINGFUL_WIKIDATA_APPEARANCES}`;
  const checkableSpells = single(warehouse, `select count(*) as value ${checkable}`);
  const checkableConfirmed = single(
    warehouse,
    `select count(*) as value ${checkable}
       and exists (select 1 from player_seasons s
                   where s.player_id = w.player_tm_id and s.club_id = w.team_tm_id)`,
  );

  // Start years, for spells Transfermarkt saw begin (first season after the data starts).
  const dated = `from cmp_tm_spells t
    join wd_careers w on w.player_tm_id = t.player_id and w.team_tm_id = t.club_id
    where t.first_season > ${FIRST_SEASON} and t.${established} and w.start_year is not null`;
  const datedSpells = single(
    warehouse,
    `select count(distinct t.player_id || ':' || t.club_id) as value ${dated}`,
  );
  const datedAgree = single(
    warehouse,
    `select count(distinct t.player_id || ':' || t.club_id) as value ${dated}
       and w.start_year between t.first_season - 1 and t.first_season + 1`,
  );

  const overlap = "from wd_careers w join tm_players p on p.player_id = w.player_tm_id";
  const overlapSpells = single(warehouse, `select count(*) as value ${overlap}`);
  const withClubId = single(
    warehouse,
    `select count(*) as value ${overlap} where w.team_tm_id is not null`,
  );
  const withStartYear = single(
    warehouse,
    `select count(*) as value ${overlap} where w.start_year is not null`,
  );
  const withAppearances = single(
    warehouse,
    `select count(*) as value ${overlap} where w.appearances is not null`,
  );

  return [
    "WIKIDATA vs TRANSFERMARKT",
    `Wikidata club spells downloaded: ${spellCount.toLocaleString("en-GB")}`,
    "",
    "1. Coverage",
    line("Transfermarkt players who have a Wikidata career", playersFound, players),
    "",
    `2. Does Wikidata know the spells Transfermarkt has? (${ESTABLISHED_LEAGUE_APPEARANCES}+ league games for a club)`,
    line("Found, counting every player", establishedFound, establishedSpells),
    line("Found, among players Wikidata has", establishedFound, establishedKnownPlayers),
    "",
    `3. Are Wikidata's spells real? (started after ${FIRST_SEASON}, ${MEANINGFUL_WIKIDATA_APPEARANCES}+ games recorded, club in a top league throughout)`,
    line("Confirmed by a Transfermarkt appearance", checkableConfirmed, checkableSpells),
    "",
    "4. Do the start years agree? (within a year of the first Transfermarkt appearance)",
    line("Agree", datedAgree, datedSpells),
    "",
    "5. How complete are Wikidata's spells for these players?",
    line("Club can be matched by Transfermarkt ID", withClubId, overlapSpells),
    line("Has a start year", withStartYear, overlapSpells),
    line("Has an appearance count", withAppearances, overlapSpells),
  ].join("\n");
}

const warehouse = openWarehouse();
const spellCount = await loadWikidataCareers(warehouse);
buildComparisonTables(warehouse);
const report = buildReport(warehouse, spellCount);
warehouse.close();

writeFileSync(WIKIDATA_REPORT_PATH, report);
console.log(report);
