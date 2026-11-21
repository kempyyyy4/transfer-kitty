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

/**
 * Short names fans use, for clubs whose official name in the data is a mouthful.
 * Applied to question prompts as they are built.
 */
export const CLUB_SHORT_NAMES: Readonly<Record<string, string>> = {
  "Associazione Sportiva Roma": "AS Roma",
  "Società Sportiva Lazio S.p.A.": "Lazio",
  "Olympiakos Syndesmos Filathlon Peiraios": "Olympiacos",
  "Panathinaikos Athlitikos Omilos": "Panathinaikos",
  "Beşiktaş Jimnastik Kulübü": "Beşiktaş",
  "Sport Club Corinthians Paulista": "Corinthians",
  "Clube de Regatas do Flamengo": "Flamengo",
  "Sociedade Esportiva Palmeiras": "Palmeiras",
  "Club Atlético River Plate": "River Plate",
  "Club Atlético Boca Juniors": "Boca Juniors",
  "São Paulo Futebol Clube": "São Paulo",
  "Santos Futebol Clube": "Santos",
  "Grêmio Foot-Ball Porto Alegrense": "Grêmio",
  "Parma Calcio 1913": "Parma",
  "Udinese Calcio": "Udinese",
  "Cagliari Calcio": "Cagliari",
  "Frosinone Calcio": "Frosinone",
  "Benevento Calcio": "Benevento",
  "Brescia Calcio": "Brescia",
  "Spezia Calcio": "Spezia",
  "Ajax Amsterdam": "Ajax",
  "FC Barcelona": "Barcelona",
  "Juventus FC": "Juventus",
  "SSC Napoli": "Napoli",
  "ACF Fiorentina": "Fiorentina",
  "Sevilla FC": "Sevilla",
  "Valencia CF": "Valencia",
  "AS Monaco": "Monaco",
  "Olympique Marseille": "Marseille",
  "Atlético de Madrid": "Atlético Madrid",
  "Bayer 04 Leverkusen": "Bayer Leverkusen",
  "SL Benfica": "Benfica",
  "FC Porto": "Porto",
  "Arsenal FC": "Arsenal",
  "Chelsea FC": "Chelsea",
  "Liverpool FC": "Liverpool",
  "Everton FC": "Everton",
  "Fulham FC": "Fulham",
  "Reading FC": "Reading",
  "Southampton FC": "Southampton",
  "Burnley FC": "Burnley",
  "Watford FC": "Watford",
  "Brentford FC": "Brentford",
  "Middlesbrough FC": "Middlesbrough",
  "Sunderland AFC": "Sunderland",
  "AFC Bournemouth": "Bournemouth",
  "Brighton & Hove Albion": "Brighton",
  "Wolverhampton Wanderers": "Wolves",
  "West Bromwich Albion": "West Brom",
  "Queens Park Rangers": "QPR",
  "Tottenham Hotspur": "Tottenham",
};
