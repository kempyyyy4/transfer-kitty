import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export async function isDatabaseReachable(): Promise<boolean> {
  const { error } = await getServiceClient()
    .from("job_runs")
    .select("job_name", { count: "exact", head: true });

  return error === null;
}
