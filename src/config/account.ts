export const ACCOUNT = {
  displayNameMinLength: 3,
  displayNameMaxLength: 20,
  /** How long a started sign-in may take before the guest's play is no longer carried over. */
  signInWindowSeconds: 3600,
} as const;
