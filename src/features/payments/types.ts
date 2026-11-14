/** What the browser is told about a player's purchases. Only their own. */
export interface Access {
  /** The lifetime unlock: Unlimited, Archive, Nine Lives and no ads. */
  lifetime: boolean;
  /** Packs they own. */
  packIds: string[];
}

export type PurchaseStatus = "pending" | "paid";
