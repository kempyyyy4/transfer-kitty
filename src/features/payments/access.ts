import "server-only";
import { getEntitlementKeys } from "@/lib/db";
import { packIdOf } from "./products";
import type { Access } from "./types";

const NO_ACCESS: Access = { lifetime: false, packIds: [] };

/** What a user has paid for. A visitor with no session has nothing. */
export async function getAccess(userId: string | null): Promise<Access> {
  if (!userId) return NO_ACCESS;
  const keys = await getEntitlementKeys(userId);
  return {
    lifetime: keys.includes("lifetime"),
    packIds: keys.map(packIdOf).filter((id): id is string => id !== null),
  };
}
