/**
 * The competitions questions are written about, keyed by their ID in the Transfermarkt
 * dataset. `name` is how the competition reads inside a prompt. The names are English
 * renderings chosen for this game, not dataset values, so they are listed in
 * QUESTIONS_TO_CHECK.md.
 */
export interface Competition {
  id: string;
  name: string;
  /** Tag value for packs and filters. */
  slug: string;
}

/** Top divisions with match data for every season from 2012/13. Order sets nothing. */
export const FEATURED_LEAGUES: readonly Competition[] = [
  { id: "GB1", name: "the Premier League", slug: "premier-league" },
  { id: "ES1", name: "La Liga", slug: "la-liga" },
  { id: "IT1", name: "Serie A", slug: "serie-a" },
  { id: "L1", name: "the Bundesliga", slug: "bundesliga" },
  { id: "FR1", name: "Ligue 1", slug: "ligue-1" },
  { id: "SC1", name: "the Scottish Premiership", slug: "scottish-premiership" },
  { id: "NL1", name: "the Eredivisie", slug: "eredivisie" },
  { id: "PO1", name: "Liga Portugal", slug: "liga-portugal" },
  { id: "TR1", name: "the Süper Lig", slug: "super-lig" },
  { id: "BE1", name: "the Belgian Pro League", slug: "belgian-pro-league" },
];

export const FEATURED_CUPS: readonly Competition[] = [
  { id: "CL", name: "the Champions League", slug: "champions-league" },
  { id: "EL", name: "the Europa League", slug: "europa-league" },
  { id: "UCOL", name: "the Conference League", slug: "conference-league" },
  { id: "FAC", name: "the FA Cup", slug: "fa-cup" },
  { id: "CDR", name: "the Copa del Rey", slug: "copa-del-rey" },
  { id: "CIT", name: "the Coppa Italia", slug: "coppa-italia" },
  { id: "DFB", name: "the DFB-Pokal", slug: "dfb-pokal" },
  { id: "SFA", name: "the Scottish Cup", slug: "scottish-cup" },
  { id: "NLP", name: "the KNVB Cup", slug: "knvb-cup" },
  { id: "USC", name: "the UEFA Super Cup", slug: "uefa-super-cup" },
];

/** Match data in the dataset starts with this season, so prompts say so. */
export const FIRST_SEASON = 2012;
export const FIRST_SEASON_LABEL = "2012/13";

/** The dataset stops here. Transfers dated later are scheduled moves, not facts yet. */
export const DATA_CUT_OFF_DATE = "2026-07-06";

export function seasonLabel(season: number): string {
  return `${season}/${String((season + 1) % 100).padStart(2, "0")}`;
}
