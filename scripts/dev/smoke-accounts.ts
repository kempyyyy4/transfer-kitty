/**
 * Checks that a guest's play follows them into an account, against the database named in
 * .env.local. Everything it creates is deleted afterwards.
 * npm run smoke:accounts
 *
 * Run by hand against the development database only, not in CI.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { ACCOUNT } from "@/config/account";
import { createLeague, getMyLeagues } from "@/features/leaderboard/service";
import {
  getDisplayName,
  mergeGuestIntoAccount,
  saveDisplayName,
  savePendingMerge,
  takePendingMerge,
} from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase/server";
import { addDays, ukDayOf } from "@/lib/time/uk-day";

const admin = getServiceClient();
const today = ukDayOf(new Date());
const tomorrow = addDays(today, 1);
const created: string[] = [];

function passed(rule: string): void {
  console.log(`  ok  ${rule}`);
}

async function createAccount(): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email: `smoke-${randomUUID()}@example.test`,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Could not create a test user: ${error?.message}`);
  created.push(data.user.id);
  return data.user.id;
}

async function createGuest(): Promise<string> {
  const env = getServerEnv();
  const visitor = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false },
    },
  );
  const { data, error } = await visitor.auth.signInAnonymously();
  if (error || !data.user) throw new Error(`Could not create a test guest: ${error?.message}`);
  created.push(data.user.id);
  return data.user.id;
}

async function finishedGame(userId: string, day: string, fee: number) {
  const { error } = await admin.from("game_sessions").insert({
    user_id: userId,
    mode: "daily",
    puzzle_date: day,
    completed_at: new Date().toISOString(),
    total_fee: fee,
    total_answer_ms: 30_000,
  });
  if (error) throw new Error(`Could not write a test game: ${error.message}`);
}

async function gamesOf(userId: string) {
  const { data } = await admin
    .from("game_sessions")
    .select("puzzle_date, total_fee")
    .eq("user_id", userId)
    .order("puzzle_date");
  return data ?? [];
}

async function run(): Promise<void> {
  const guest = await createGuest();
  const account = await createAccount();

  await finishedGame(guest, today, 111_000_000);
  await finishedGame(guest, tomorrow, 222_000_000);
  await finishedGame(account, today, 50_000_000);
  const guestLeague = await createLeague(guest, "Guest Made FC");
  assert.equal(guestLeague.status, "created");

  const token = `smoke-${randomUUID()}`;
  await savePendingMerge(token, guest);
  assert.equal(await takePendingMerge(token, ACCOUNT.signInWindowSeconds), guest);
  assert.equal(await takePendingMerge(token, ACCOUNT.signInWindowSeconds), null);
  passed("a sign-in token finds its guest once, then never again");

  assert.deepEqual(await mergeGuestIntoAccount(account, guest), { status: "not_a_guest" });
  passed("an account can never be merged into someone else");

  const merged = await mergeGuestIntoAccount(guest, account);
  assert.deepEqual(merged, { status: "merged", gamesMoved: 1, gamesDropped: 1 });
  assert.deepEqual(await gamesOf(account), [
    { puzzle_date: today, total_fee: 50_000_000 },
    { puzzle_date: tomorrow, total_fee: 222_000_000 },
  ]);
  assert.deepEqual(await gamesOf(guest), []);
  passed("the guest's games move over, and on a day both played the account's game is kept");

  const leagues = await getMyLeagues(account);
  assert.ok(leagues.some((league) => league.name === "Guest Made FC"));
  assert.deepEqual(await getMyLeagues(guest), []);
  const { data: owned } = await admin
    .from("leagues")
    .select("owner_id")
    .eq("name", "Guest Made FC");
  assert.ok(owned?.every((league) => league.owner_id === account));
  passed("the guest's leagues and league ownership move over");

  const name = `Smoke${randomUUID().slice(0, 8)}`;
  assert.equal(await saveDisplayName(account, name), "saved");
  assert.equal(await getDisplayName(account), name);
  const other = await createAccount();
  assert.equal(await saveDisplayName(other, name.toUpperCase()), "taken");
  passed("display names save, and nobody else can take one in different capitals");

  for (const league of leagues) {
    await admin.from("leagues").delete().eq("id", league.id);
  }
}

try {
  await run();
  console.log("\nAll account rules hold.");
} finally {
  for (const userId of created) await admin.auth.admin.deleteUser(userId);
}
