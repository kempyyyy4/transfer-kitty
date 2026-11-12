export type AccountStatus =
  | { status: "none" }
  | { status: "guest" }
  | { status: "signed_in"; email: string | null; displayName: string | null };
