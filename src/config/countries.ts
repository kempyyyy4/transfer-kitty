/**
 * Cleaning up nationalities, so each country is one question with every player in it.
 * Spelling only: these say which names mean the same country, not who plays for it.
 */

/**
 * The Transfermarkt dataset spells a few countries two ways, which split their players
 * across two questions (found 18 November 2026). Each maps to the name fans use.
 */
export const COUNTRY_ALIASES: Readonly<Record<string, string>> = {
  Türkiye: "Turkey",
  Neukaledonien: "New Caledonia",
};

/**
 * Where Transfermarkt has no nationality for a player, Wikidata's "country for sport" fills
 * it (then citizenship). Wikidata's English names that differ from the dataset's are
 * mapped here; any name still not in the dataset's own list of countries is not used.
 */
export const WIKIDATA_COUNTRY_NAMES: Readonly<Record<string, string>> = {
  "Kingdom of the Netherlands": "Netherlands",
  "Republic of Ireland": "Ireland",
  "People's Republic of China": "China",
  "Ivory Coast": "Cote d'Ivoire",
  "Democratic Republic of the Congo": "DR Congo",
  "Republic of the Congo": "Congo",
  "South Korea": "Korea, South",
  "North Korea": "Korea, North",
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
  "United States of America": "United States",
  Czechia: "Czech Republic",
  "Cape Verde": "Cape Verde",
  "The Gambia": "The Gambia",
  Gambia: "The Gambia",
  "Hong Kong": "Hongkong",
};
