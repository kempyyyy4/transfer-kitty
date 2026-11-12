import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

export type PackKind = "era" | "world_cup" | "player" | "other";
export type PackStatus = "draft" | "live" | "retired";

const packRowSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    kind: z.enum(["era", "world_cup", "player", "other"]),
    status: z.enum(["draft", "live", "retired"]),
    pack_questions: z.array(z.object({ count: z.number() })),
  })
  .transform((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    kind: row.kind,
    status: row.status,
    questionCount: row.pack_questions[0]?.count ?? 0,
  }));

export type PackRow = z.infer<typeof packRowSchema>;

const PACK_COLUMNS = "id, slug, name, description, kind, status, pack_questions(count)";

export async function readPacks(limit: number): Promise<PackRow[]> {
  const { data, error } = await getServiceClient()
    .from("packs")
    .select(PACK_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Reading packs failed: ${error.message}`);
  return z.array(packRowSchema).parse(data);
}

const packQuestionsSchema = z.array(
  z.object({
    questions: z.object({ id: z.string(), prompt: z.string(), status: z.string() }),
  }),
);

export interface PackDetail extends PackRow {
  questions: { id: string; prompt: string; status: string }[];
}

export async function readPack(packId: string): Promise<PackDetail | null> {
  const client = getServiceClient();
  const [pack, questions] = await Promise.all([
    client.from("packs").select(PACK_COLUMNS).eq("id", packId).maybeSingle(),
    client
      .from("pack_questions")
      .select("questions(id, prompt, status)")
      .eq("pack_id", packId)
      .order("added_at"),
  ]);
  const error = pack.error ?? questions.error;
  if (error) throw new Error(`Reading the pack failed: ${error.message}`);
  if (!pack.data) return null;

  return {
    ...packRowSchema.parse(pack.data),
    questions: packQuestionsSchema.parse(questions.data).map((row) => row.questions),
  };
}

export interface PackFields {
  slug: string;
  name: string;
  description: string;
  kind: PackKind;
}

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

/** Returns the new pack's ID, or null if the slug is already taken. */
export async function insertPack(fields: PackFields): Promise<string | null> {
  const { data, error } = await getServiceClient().from("packs").insert(fields).select("id");
  if (error?.code === UNIQUE_VIOLATION) return null;
  if (error) throw new Error(`Adding the pack failed: ${error.message}`);
  return z.array(z.object({ id: z.string() })).parse(data)[0]?.id ?? null;
}

/** Returns false if there is no such pack. */
export async function updatePack(
  packId: string,
  fields: Partial<Omit<PackFields, "slug">> & { status?: PackStatus },
): Promise<boolean> {
  const { data, error } = await getServiceClient()
    .from("packs")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", packId)
    .select("id");
  if (error) throw new Error(`Saving the pack failed: ${error.message}`);
  return data.length > 0;
}

/** Returns false if the pack or question does not exist. Adding one twice is fine. */
export async function addPackQuestion(packId: string, questionId: string): Promise<boolean> {
  const { error } = await getServiceClient()
    .from("pack_questions")
    .upsert({ pack_id: packId, question_id: questionId }, { ignoreDuplicates: true });
  if (error?.code === FOREIGN_KEY_VIOLATION) return false;
  if (error) throw new Error(`Adding the question to the pack failed: ${error.message}`);
  return true;
}

export async function removePackQuestion(packId: string, questionId: string): Promise<void> {
  const { error } = await getServiceClient()
    .from("pack_questions")
    .delete()
    .eq("pack_id", packId)
    .eq("question_id", questionId);
  if (error) throw new Error(`Removing the question from the pack failed: ${error.message}`);
}
