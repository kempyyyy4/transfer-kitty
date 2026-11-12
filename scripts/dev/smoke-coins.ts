/**
 * Checks the coin ledger and shop against the database named in .env.local: rewards are
 * paid once, a balance can never go below zero, and a guest's coins follow them into an
 * account. Everything it creates is deleted afterwards.
 * npm run smoke:coins
 *
 * Run by hand against the development database only, not in CI.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { COIN_REWARDS } from "@/config/coins";
import { payRoundCoins } from "@/features/coins/service";
import { listPrices, setPrice } from "@/features/shop/service";
import { buyItem, getCoinBalance, getOwnedItemKeys, mergeGuestIntoAccount } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase/server";
import { ukDayOf } from "@/lib/time/uk-day";

const db = getServiceClient();
const today = ukDayOf(new Date());
const created: string[] = [];

function passed(rule: string): void {
  console.log(`  ok  ${rule}`);
}

async function createAccount(): Promise<string> {
  const { data, error } = await db.auth.admin.createUser({
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
    { auth: { persistSession: false } },
  );
  const { data, error } = await visitor.auth.signInAnonymously();
  if (error || !data.user) throw new Error(`Could not create a test guest: ${error?.message}`);
  created.push(data.user.id);
  return data.user.id;
}

async function finishedRound(userId: string, mode: "daily" | "unlimited"): Promise<string> {
  const { data, error } = await db
    .from("game_sessions")
    .insert({
      user_id: userId,
      mode,
      puzzle_date: mode === "daily" ? today : null,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`Could not write a test game: ${error.message}`);
  return data.id as string;
}

async function giveCoins(userId: string, coins: number): Promise<void> {
  const { error } = await db.from("coin_ledger").insert({
    user_id: userId,
    delta: coins,
    reason: "admin",
    idempotency_key: `smoke:${randomUUID()}`,
  });
  if (error) throw new Error(`Could not give test coins: ${error.message}`);
}

async function checkRewards(account: string): Promise<void> {
  const session = await finishedRound(account, "daily");
  const expected = COIN_REWARDS.dailyComplete + 2 * COIN_REWARDS.perGalacticat;
  assert.equal(await payRoundCoins(account, session, 2, new Date()), expected);
  assert.equal(await payRoundCoins(account, session, 2, new Date()), expected);
  assert.equal(await getCoinBalance(account), expected);
  passed("a round's coins are paid once, however often the summary is read");
}

async function checkSpending(account: string): Promise<void> {
  const before = await getCoinBalance(account);
  assert.equal(await buyItem(account, "kit", "gold-sash", before + 1), "too_poor");
  passed("an item dearer than the balance cannot be bought");

  await giveCoins(account, 700 - before);
  assert.equal(await buyItem(account, "kit", "merseyside-red", 300), "bought");
  assert.equal(await buyItem(account, "kit", "merseyside-red", 300), "owned");
  assert.equal(await getCoinBalance(account), 400);
  assert.ok((await getOwnedItemKeys(account)).has("kit:merseyside-red"));
  passed("buying takes the price once and records the item as owned");

  const attempts = await Promise.all([
    buyItem(account, "kit", "sky-blue-mancs", 300),
    buyItem(account, "kit", "claret-and-blue", 300),
    buyItem(account, "kit", "green-and-white-hoops", 300),
  ]);
  assert.equal(attempts.filter((outcome) => outcome === "bought").length, 1);
  assert.equal(await getCoinBalance(account), 100);
  passed("three purchases at once cannot spend more than the balance");
}

async function checkMerge(account: string): Promise<void> {
  const guest = await createGuest();
  const clashing = await finishedRound(guest, "daily");
  const kept = await finishedRound(guest, "unlimited");
  await payRoundCoins(guest, clashing, 0, new Date());
  await giveCoins(guest, 25);
  const { error } = await db.from("coin_ledger").insert({
    user_id: guest,
    delta: 7,
    reason: "admin",
    session_id: kept,
    idempotency_key: `smoke:${randomUUID()}`,
  });
  if (error) throw new Error(error.message);

  const before = await getCoinBalance(account);
  const merged = await mergeGuestIntoAccount(guest, account);
  assert.equal(merged.status, "merged");
  assert.equal(await getCoinBalance(account), before + 25 + 7);
  assert.equal(await getCoinBalance(guest), 0);
  passed("a guest's coins follow them, except rewards for a day the account already played");
}

async function checkAdminPrices(): Promise<void> {
  const priceOf = async () =>
    (await listPrices()).find((item) => item.slot === "kit" && item.id === "gold-sash");
  const original = await priceOf();
  try {
    assert.equal(await setPrice("kit", "gold-sash", 123, false), true);
    assert.deepEqual(
      { price: (await priceOf())?.priceCoins, onSale: (await priceOf())?.onSale },
      { price: 123, onSale: false },
    );
    assert.equal(await setPrice("kit", "no-such-kit", 1, true), false);
    passed("Admin can change a price and take an item off sale, only for real items");
  } finally {
    await db.from("shop_prices").delete().eq("slot", "kit").eq("item_id", "gold-sash");
  }
  assert.equal((await priceOf())?.priceCoins, original?.priceCoins);
}

async function run(): Promise<void> {
  await checkAdminPrices();
  const account = await createAccount();
  await checkRewards(account);
  await checkSpending(account);
  await checkMerge(account);
}

try {
  await run();
  console.log("\nAll coin rules hold.");
} finally {
  for (const userId of created) await db.auth.admin.deleteUser(userId);
}
