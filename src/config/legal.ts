/**
 * Who runs Transfer Kitty, for the privacy policy and terms. Tom fills these in before
 * launch; until then the pages show "to be confirmed". Both pages are drafts until a
 * qualified person has checked them (PLAN.md section 3).
 */
export const LEGAL = {
  /** The person or company running the site, e.g. "A. Person, trading as Transfer Kitty". */
  operatorName: null as string | null,
  /** Where players write about their data or a purchase. */
  contactEmail: null as string | null,
  /** Set to false once the texts have been checked. */
  isDraft: true,
  lastUpdated: "14 November 2026",
  /** The UK regulator players can complain to about their data. */
  regulator: { name: "Information Commissioner's Office (ICO)", url: "https://ico.org.uk" },
} as const;

export const TO_BE_CONFIRMED = "[to be confirmed before launch]";
