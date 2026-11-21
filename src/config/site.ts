/** The live address and how the site describes itself to search engines. */
export const SITE = {
  url: "https://transferkitty.io",
  name: "Transfer Kitty",
  title: "Transfer Kitty | Daily football trivia game",
  description:
    "The daily football trivia game where rare answers earn big transfer fees. Name the player, build your kitty and climb Top Kitties.",
  /** Pages worth finding in a search. Accounts, admin and receipts are left out. */
  publicPaths: ["/", "/play", "/top-kitties", "/unlimited", "/shop", "/privacy", "/terms"],
  privatePaths: ["/admin", "/api/", "/auth/", "/account", "/purchase", "/profile"],
} as const;
