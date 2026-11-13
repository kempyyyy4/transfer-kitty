/**
 * Checks payments, entitlements and the paid modes against the database named in
 * .env.local. Stripe itself is not called: webhooks are signed here with a throwaway
 * secret, exactly as Stripe signs them. Everything it creates is deleted afterwards.
 * npm run smoke:payments
 *
 * Run by hand against the development database only, not in CI.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";

// Before anything reads the settings: a test-only key and webhook secret for this run.
process.env.STRIPE_SECRET_KEY = "sk_test_smoke_not_a_real_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_smoke_test_secret";

const { startPracticeGame } = await import("@/features/game/practice");
const { advanceGame, answerQuestion } = await import("@/features/game/service");
const { getAccess } = await import("@/features/payments/access");
const { handleStripeWebhook } = await import("@/features/payments/service");
const { getCoinBalance, insertPurchase, attachStripeSession, insertPack } =
  await import("@/lib/db");
const { getServiceClient } = await import("@/lib/supabase/server");
const { addDays, ukDayOf } = await import("@/lib/time/uk-day");

const db = getServiceClient();
const stripe = new Stripe("sk_test_smoke_not_a_real_key");
const today = ukDayOf(new Date());
const users: string[] = [];
const packs: string[] = [];

function passed(rule: string): void {
  console.log(`  ok  ${rule}`);
}

async function createAccount(): Promise<string> {
  const { data, error } = await db.auth.admin.createUser({
    email: `smoke-${randomUUID()}@example.test`,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Could not create a test user: ${error?.message}`);
  users.push(data.user.id);
  return data.user.id;
}

/** A Checkout started on our side, then "paid" by a webhook signed like Stripe's. */
async function pay(userId: string, productKey: string, pricePence: number, paidPence = pricePence) {
  const purchaseId = await insertPurchase(userId, productKey, pricePence);
  const sessionId = `cs_test_smoke_${randomUUID()}`;
  await attachStripeSession(purchaseId, sessionId);
  const body = JSON.stringify({
    id: `evt_smoke_${randomUUID()}`,
    object: "event",
    type: "checkout.session.completed",
    data: { object: { id: sessionId, payment_status: "paid", amount_total: paidPence } },
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret: "whsec_smoke_test_secret",
  });
  return { body, signature, send: () => handleStripeWebhook(body, signature) };
}

async function checkWebhook(userId: string): Promise<void> {
  const forged = await pay(userId, "lifetime", 399);
  assert.equal(await handleStripeWebhook(forged.body, "t=1,v1=forged"), "bad_signature");
  assert.equal((await getAccess(userId)).lifetime, false);
  passed("a webhook without Stripe's signature is refused");

  assert.equal(await forged.send(), "fulfilled");
  assert.equal(await forged.send(), "duplicate");
  assert.equal((await getAccess(userId)).lifetime, true);
  passed("a paid lifetime unlock is granted once, however often Stripe repeats the event");

  const coins = await pay(userId, "coins-1200", 199);
  assert.equal(await coins.send(), "fulfilled");
  assert.equal(await coins.send(), "duplicate");
  assert.equal(await getCoinBalance(userId), 1200);
  passed("a coin pack adds its coins to the ledger once");

  const short = await pay(userId, "coins-3500", 499, 1);
  assert.equal(await short.send(), "amount_mismatch");
  assert.equal(await getCoinBalance(userId), 1200);
  passed("a payment for the wrong amount grants nothing");
}

async function liveQuestionIds(): Promise<Set<string>> {
  const { data } = await db
    .from("daily_puzzle_questions")
    .select("question_id")
    .gte("puzzle_date", today);
  return new Set((data ?? []).map((row: { question_id: string }) => row.question_id));
}

async function checkUnlimited(userId: string): Promise<void> {
  const free = await createAccount();
  assert.deepEqual(await startPracticeGame(free, { mode: "unlimited" }, new Date()), {
    status: "locked",
  });
  passed("Unlimited and Archive stay locked without the lifetime unlock");

  const live = await liveQuestionIds();
  for (let round = 0; round < 3; round++) {
    const started = await startPracticeGame(userId, { mode: "unlimited" }, new Date());
    assert.equal(started.status, "started");
    if (started.status !== "started") return;
    const { data } = await db
      .from("session_questions")
      .select("question_id, questions(prominence)")
      .eq("session_id", started.game.sessionId);
    const rows = (data ?? []) as unknown as {
      question_id: string;
      questions: { prominence: number };
    }[];
    assert.equal(rows.length, 7);
    for (const row of rows) {
      assert.ok(!live.has(row.question_id), "served a question from today's or a coming daily");
    }
  }
  passed("Unlimited never serves a question from today's or a coming daily puzzle");

  const round = await startPracticeGame(userId, { mode: "unlimited" }, new Date());
  if (round.status !== "started") throw new Error("Unlimited round did not start");
  const sessionId = round.game.sessionId;
  const { data: first } = await db
    .from("session_questions")
    .select("question_id")
    .eq("session_id", sessionId)
    .eq("position", 1)
    .single();
  const playsOf = async () =>
    (await db.from("questions").select("times_played").eq("id", first?.question_id).single()).data
      ?.times_played;
  const before = await playsOf();
  await advanceGame(userId, sessionId);
  await answerQuestion(userId, sessionId, 1, null);
  assert.equal(await playsOf(), before);
  passed("a replayed question leaves the crowd figures that set tiers unchanged");

  const archive = await startPracticeGame(userId, { mode: "archive", date: today }, new Date());
  assert.equal(archive.status, "not_found");
  const future = addDays(today, 3);
  assert.equal(
    (await startPracticeGame(userId, { mode: "archive", date: future }, new Date())).status,
    "not_found",
  );
  passed("the Archive never opens today's or a future puzzle");
}

async function checkPacks(userId: string): Promise<void> {
  const packId = await insertPack({
    slug: `smoke-${randomUUID().slice(0, 8)}`,
    name: "Smoke Pack",
    description: "",
    kind: "other",
  });
  assert.ok(packId);
  packs.push(packId);
  const { data } = await db
    .from("questions")
    .select("id")
    .eq("status", "active")
    .lt("prominence", 100)
    .limit(3);
  const questionIds = (data ?? []).map((row: { id: string }) => row.id);
  await db
    .from("pack_questions")
    .insert(questionIds.map((id) => ({ pack_id: packId, question_id: id })));

  const round = { mode: "pack" as const, packId };
  assert.equal((await startPracticeGame(userId, round, new Date())).status, "locked");
  await db.from("packs").update({ status: "live" }).eq("id", packId);
  assert.equal(await (await pay(userId, `pack:${packId}`, 199)).send(), "fulfilled");
  const started = await startPracticeGame(userId, round, new Date());
  assert.equal(started.status, "started");
  if (started.status !== "started") return;
  const { data: served } = await db
    .from("session_questions")
    .select("question_id")
    .eq("session_id", started.game.sessionId);
  assert.deepEqual(
    new Set((served ?? []).map((row: { question_id: string }) => row.question_id)),
    new Set(questionIds),
  );
  passed("a bought pack plays rounds from its own questions only");
}

async function run(): Promise<void> {
  const userId = await createAccount();
  await checkWebhook(userId);
  await checkUnlimited(userId);
  await checkPacks(userId);
}

try {
  await run();
  console.log("\nAll payment rules hold.");
} finally {
  for (const userId of users) await db.auth.admin.deleteUser(userId);
  for (const packId of packs) {
    await db.from("game_sessions").delete().eq("pack_id", packId);
    await db.from("pack_questions").delete().eq("pack_id", packId);
    await db.from("packs").delete().eq("id", packId);
  }
}
