export const ACCOUNT = {
  displayNameMinLength: 3,
  displayNameMaxLength: 20,
  /** How long a started sign-in may take before the guest's play is no longer carried over. */
  signInWindowSeconds: 3600,
} as const;

/**
 * Names nobody may take, because they could pass for the game itself or its staff. Matched
 * ignoring case, spaces and punctuation, anywhere in the name. Add to this freely.
 */
export const RESERVED_NAME_PARTS = [
  "admin",
  "moderator",
  "transferkitty",
  "kitthecat",
  "official",
  "support",
  "staff",
] as const;
