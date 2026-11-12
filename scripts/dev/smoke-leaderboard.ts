/**
 * Checks Top Kitties and friends leagues against the database named in .env.local, with
 * throwaway players whose results are written straight into the database. Everything it
 * creates is deleted afterwards.
 * npm run smoke:leaderboard
 *
 * Run by hand against the development database only, not in CI.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { DAILY_PUZZLE } from "@/config/game";
import {
  createLeague,
  getBoard,
  getMyLeagues,
  joinLeague,
  leaveLeague,
} from "@/features/leaderboard/service";
import { readLeaderboard } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase/server";
import { addDays, ukDayOf, weekContaining } from "@/lib/time/uk-day";

const admin = getServiceClient();
const now = new Date();
const today = ukDayOf(now);
const created: string[] = [];

/** Who is looking at a board. */
function viewer(userId: string, isGuest = false) {
  return { userId, isGuest };
}

function passed(rule: string): void {
  console.log(`  ok  ${rule}`);
}

async function createPlayer(): Promise<string> {
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

/** A finished daily game, written directly: what matters here is ranking, not play. */
async function finishedGame(userId: string, day: string, fee: number, answerMs: number) {
  const { error } = await admin.from("game_sessions").insert({
    user_id: userId,
    mode: "daily",
    puzzle_date: day,
    completed_at: new Date().toISOString(),
    total_fee: fee,
    total_answer_ms: answerMs,
  });
  if (error) throw new Error(`Could not write a test game: ${error.message}`);
}

async function run(): Promise<void> {
  const alice = await createPlayer();
  const bob = await createPlayer();
  const guest = await createGuest();
  const outsider = await createPlayer();

  // A later day in the same week, which has a puzzle because puzzles are made ahead.
  const laterThisWeek = addDays(today, 1) <= weekContaining(today).to ? addDays(today, 1) : null;
  assert.ok(today >= DAILY_PUZZLE.firstPuzzleDate, "today has no puzzle to attach games to");

  await finishedGame(alice, today, 300_000_000, 50_000);
  await finishedGame(bob, today, 300_000_000, 40_000);
  await finishedGame(guest, today, 100_000_000, 20_000);
  if (laterThisWeek) await finishedGame(alice, laterThisWeek, 100_000_000, 10_000);

  const made = await createLeague(alice, "Smoke Test FC");
  assert.equal(made.status, "created");
  assert.ok(made.status === "created");
  const { league } = made;
  assert.match(league.inviteCode, /^[A-HJ-KM-NP-Z2-9]{6}$/);
  passed(`a league is created with a readable invite code (${league.inviteCode})`);

  const typedLoosely = `${league.inviteCode.slice(0, 3).toLowerCase()} ${league.inviteCode.slice(3)}`;
  assert.deepEqual(await joinLeague(bob, typedLoosely), { status: "joined", leagueId: league.id });
  assert.deepEqual(await joinLeague(guest, league.inviteCode), {
    status: "joined",
    leagueId: league.id,
  });
  assert.deepEqual(await joinLeague(bob, league.inviteCode), {
    status: "joined",
    leagueId: league.id,
  });
  passed("friends join by code, typed in any case with spaces, and joining twice is harmless");

  assert.deepEqual(await joinLeague(outsider, "nope"), { status: "bad_code" });
  assert.deepEqual(await joinLeague(outsider, "ZZZZZZ"), { status: "not_found" });
  passed("a malformed or unknown code is refused");

  const todayBoard = await getBoard(viewer(alice), "today", league.id, now);
  assert.ok(todayBoard);
  assert.equal(todayBoard.players, 2);
  assert.deepEqual(
    todayBoard.entries.map((entry) => [entry.rank, entry.isYou, entry.total]),
    [
      [1, false, 300_000_000],
      [2, true, 300_000_000],
    ],
  );
  assert.equal(todayBoard.you?.rank, 2);
  passed("today's league board ranks by kitty, a tie goes to the faster player, guests are off");

  const guestView = await getBoard(viewer(guest, true), "today", league.id, now);
  assert.equal(
    guestView?.entries.some((entry) => entry.isYou),
    false,
  );
  assert.equal(guestView?.you?.rank, 3);
  assert.equal(guestView?.signInToAppear, true);
  assert.equal(todayBoard.signInToAppear, false);
  passed("a guest is not on the board, sees their own rank, and is asked to sign in");

  if (laterThisWeek) {
    const weekBoard = await getBoard(viewer(alice), "week", league.id, now);
    assert.equal(weekBoard?.entries[0]?.isYou, true);
    assert.equal(weekBoard?.entries[0]?.total, 400_000_000);
    assert.equal(weekBoard?.entries[0]?.days, 2);
    passed("the weekly board adds up every day of the week");
  }

  const allBoard = await getBoard(viewer(bob), "all", league.id, now);
  assert.equal(allBoard?.you?.total, 300_000_000);
  passed("the all-time board totals every finished game");

  assert.equal(await getBoard(viewer(outsider), "today", league.id, now), null);
  passed("someone outside a league cannot see its board");

  const everyone = await getBoard(viewer(alice), "today", null, now);
  assert.ok(everyone && everyone.players >= 2);
  const bobRankEverywhere = (await getBoard(viewer(bob), "today", null, now))?.you?.rank ?? 0;
  assert.ok(bobRankEverywhere < (everyone.you?.rank ?? 0));
  passed(`the everyone board includes these players (${everyone.players} players today)`);

  const withoutGuests = await readLeaderboard({
    from: today,
    to: today,
    leagueId: league.id,
    userId: guest,
    limit: 50,
    includeGuests: false,
  });
  assert.equal(withoutGuests.entries.length, 2);
  assert.ok(withoutGuests.entries.every((entry) => !entry.name.startsWith("Guest")));
  assert.equal(withoutGuests.you?.rank, 3);
  passed("with guests hidden, a guest is left off the board but still sees their own rank");

  assert.equal((await getMyLeagues(bob)).find((mine) => mine.id === league.id)?.members, 3);
  assert.equal(await leaveLeague(guest, league.id), true);
  assert.equal(await leaveLeague(guest, league.id), false);
  assert.equal((await getMyLeagues(bob)).find((mine) => mine.id === league.id)?.members, 2);
  passed("leaving a league works once and updates the member count");

  await leaveLeague(alice, league.id);
  await leaveLeague(bob, league.id);
  const { count } = await admin
    .from("leagues")
    .select("id", { count: "exact", head: true })
    .eq("id", league.id);
  assert.equal(count, 0);
  passed("a league with nobody left in it is deleted");
}

try {
  await run();
  console.log("\nAll leaderboard rules hold.");
} finally {
  for (const userId of created) await admin.auth.admin.deleteUser(userId);
}
