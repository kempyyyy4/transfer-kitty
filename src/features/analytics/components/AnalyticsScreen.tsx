"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { ANALYTICS } from "@/config/analytics";
import { TIERS } from "@/config/tiers";
import { addDays, ukDayOf } from "@/lib/time/uk-day";
import {
  countryName,
  formatCount,
  formatDuration,
  formatPence,
  formatPercent,
  shortDay,
  toCsv,
} from "../format";
import type { AnalyticsReport } from "../types";
import { BarList, ColumnChart, SERIES, StatTile, TrendChart } from "./charts";

type Status =
  | { kind: "loading" }
  | { kind: "locked" }
  | { kind: "error" }
  | { kind: "ready"; report: AnalyticsReport };

const RANGE_LABELS: Record<number, string> = {
  1: "TODAY",
  7: "7 DAYS",
  30: "30 DAYS",
  90: "90 DAYS",
  365: "YEAR",
};

/**
 * The site dashboard: traffic, engagement, players, accounts, money. Admin only. Traffic
 * comes from cookie-free page views; everything else from the game's own records.
 */
export function AnalyticsScreen() {
  const [days, setDays] = useState<number>(30);
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    const to = ukDayOf(new Date());
    const from = addDays(to, -(days - 1));
    let current = true;
    fetch(`/api/admin/analytics?from=${from}&to=${to}`)
      .then(async (response) => {
        if (!current) return;
        if (response.status === 404) return setStatus({ kind: "locked" });
        if (!response.ok) return setStatus({ kind: "error" });
        setStatus({ kind: "ready", report: (await response.json()) as AnalyticsReport });
      })
      .catch(() => current && setStatus({ kind: "error" }));
    return () => {
      current = false;
    };
  }, [days]);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pr-14">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">ANALYTICS</h1>
          <p className="page-lead">Cookie-free: no banner needed. UK days.</p>
        </div>
        <Link href="/admin" className="pixel-button px-3 py-2 text-[10px]">
          BACK TO ADMIN
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Date range">
        {ANALYTICS.ranges.map((range) => (
          <button
            key={range}
            type="button"
            aria-pressed={days === range}
            onClick={() => {
              setStatus({ kind: "loading" });
              setDays(range);
            }}
            className={`pixel-button px-3 py-2 text-[10px] ${
              days === range ? "border-floodlight text-floodlight" : ""
            }`}
          >
            {RANGE_LABELS[range] ?? `${range} DAYS`}
          </button>
        ))}
      </nav>

      {status.kind === "loading" ? <Loader /> : null}
      {status.kind === "error" ? (
        <p className="pixel-panel border-claret p-3">The figures did not load. Try again.</p>
      ) : null}
      {status.kind === "locked" ? (
        <p className="pixel-panel p-3">
          Unlock the{" "}
          <Link href="/admin" className="text-floodlight underline">
            admin area
          </Link>{" "}
          first, then come back.
        </p>
      ) : null}
      {status.kind === "ready" ? <Dashboard report={status.report} /> : null}
    </section>
  );
}

function Dashboard({ report }: { report: AnalyticsReport }) {
  const { traffic, game, accounts, money, social } = report;
  const series = (pick: (day: AnalyticsReport["daily"][number]) => number) =>
    report.daily.map((day) => ({ label: shortDay(day.day), value: pick(day) }));
  const completed = game.byMode.reduce((sum, mode) => sum + mode.completed, 0);
  const started = game.byMode.reduce((sum, mode) => sum + mode.started, 0);
  const shares = report.events.find((event) => event.key === "share")?.count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <Group title="Traffic">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="VISITORS" value={formatCount(traffic.visitors)} note="Unique per day" />
          <StatTile label="PAGE VIEWS" value={formatCount(traffic.pageviews)} />
          <StatTile label="VISITS" value={formatCount(traffic.visits)} />
          <StatTile
            label="ENGAGEMENT / VISITOR"
            value={formatDuration(traffic.avgEngagementPerVisitorMs)}
            note="Time with the page in view"
          />
          <StatTile
            label="BOUNCE RATE"
            value={traffic.bounceRate === null ? "-" : `${traffic.bounceRate}%`}
            note="One page, under 10s"
          />
          <StatTile
            label="PAGES / VISIT"
            value={traffic.pagesPerVisit === null ? "-" : String(traffic.pagesPerVisit)}
            note={`Visit length ${formatDuration(traffic.avgVisitMs)}`}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <TrendChart title="Visitors" points={series((d) => d.visitors)} format={formatCount} />
          <TrendChart title="Page views" points={series((d) => d.pageviews)} format={formatCount} />
          <TrendChart
            title="Engaged time"
            points={series((d) => d.engagedMs)}
            format={(ms) => formatDuration(ms)}
          />
          <ColumnChart
            title="Page views by hour (UK)"
            columns={report.hours.map((value, hour) => ({
              label: `${String(hour).padStart(2, "0")}:00`,
              value,
            }))}
            format={formatCount}
          />
        </div>
      </Group>

      <Group title="Where visitors come from">
        <div className="grid gap-3 lg:grid-cols-3">
          <BarList
            title="Referrers"
            rows={report.referrers.map((row) => ({
              key: row.key || "Direct or unknown",
              value: row.visitors,
              detail: "visitors",
            }))}
            format={formatCount}
          />
          <BarList
            title="Countries"
            rows={report.countries.map((row) => ({
              key: countryName(row.key),
              value: row.visitors,
            }))}
            format={formatCount}
            empty="Shows once the site is hosted on Vercel."
          />
          <BarList
            title="Campaigns (utm_source)"
            rows={report.utmSources
              .filter((row) => row.key)
              .map((row) => ({ key: row.key, value: row.visitors }))}
            format={formatCount}
            empty="Add ?utm_source=tiktok to links you post to see them here."
          />
          <BarList
            title="Devices"
            rows={report.devices.map((row) => ({ key: row.key, value: row.visitors }))}
            format={formatCount}
          />
          <BarList
            title="Browsers"
            rows={report.browsers.map((row) => ({ key: row.key, value: row.visitors }))}
            format={formatCount}
          />
          <BarList
            title="Systems"
            rows={report.systems.map((row) => ({ key: row.key, value: row.visitors }))}
            format={formatCount}
          />
        </div>
      </Group>

      <Group title="Pages">
        <div className="grid gap-3 lg:grid-cols-2">
          <BarList
            title="Top pages"
            rows={report.pages.map((row) => ({
              key: row.key,
              value: row.views,
              detail: `${formatCount(row.visitors)} visitors`,
            }))}
            format={formatCount}
          />
          <BarList
            title="Time on page (average)"
            rows={report.pageEngagement.map((row) => ({
              key: row.key,
              value: row.avgMs,
              detail: `${formatCount(row.views)} views`,
            }))}
            format={(ms) => formatDuration(ms)}
          />
          <BarList
            title="Entry pages"
            rows={report.entryPages.map((row) => ({ key: row.key, value: row.visits }))}
            format={formatCount}
          />
          <BarList
            title="Exit pages"
            rows={report.exitPages.map((row) => ({ key: row.key, value: row.visits }))}
            format={formatCount}
          />
        </div>
      </Group>

      <Group title="Players">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="ACTIVE PLAYERS" value={formatCount(game.activePlayers)} />
          <StatTile label="NEW PLAYERS" value={formatCount(game.newPlayers)} />
          <StatTile label="RETURNING" value={formatCount(game.returningPlayers)} />
          <StatTile
            label="ROUNDS FINISHED"
            value={formatCount(completed)}
            note={`${formatPercent(completed, started)} of ${formatCount(started)} started`}
          />
          <StatTile
            label="DAY-1 RETENTION"
            value={formatPercent(game.retention.day1, game.retention.cohort)}
            note={`Of ${formatCount(game.retention.cohort)} first-timers`}
          />
          <StatTile
            label="DAY-7 RETENTION"
            value={formatPercent(game.retention.day7, game.retention.cohort)}
            note="Back within a week"
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <TrendChart
            title="Players per day"
            points={series((d) => d.players)}
            format={formatCount}
            colour={SERIES.aqua}
          />
          <TrendChart
            title="Rounds finished per day"
            points={series((d) => d.roundsCompleted)}
            format={formatCount}
            colour={SERIES.aqua}
          />
          <BarList
            title="Rounds by mode"
            rows={game.byMode.map((mode) => ({
              key: mode.mode,
              value: mode.completed,
              detail: `${formatCount(mode.players)} players`,
            }))}
            format={formatCount}
            colour={SERIES.aqua}
          />
          <ColumnChart
            title="Daily answers by tier"
            columns={[...TIERS]
              .sort((a, b) => a.level - b.level)
              .map((tier) => ({
                label: tier.name,
                value: game.tiers.find((row) => row.tier === tier.level)?.count ?? 0,
              }))}
            format={formatCount}
            colour={SERIES.aqua}
          />
        </div>
        <Funnel
          steps={[
            { label: "Visitors", value: traffic.visitors },
            { label: "Played", value: game.activePlayers },
            { label: "Finished a round", value: completed },
            { label: "Shared", value: shares },
            { label: "New accounts", value: accounts.newAccounts },
          ]}
        />
        <p className="text-lg text-chalk-dim">
          Average time to answer: {formatDuration(game.avgAnswerMs)}.{" "}
          {game.outcomes.map((row) => `${formatCount(row.count)} ${row.outcome}`).join(", ")}.
        </p>
      </Group>

      <Group title="Accounts">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="NEW ACCOUNTS" value={formatCount(accounts.newAccounts)} />
          <StatTile label="NEW GUESTS" value={formatCount(accounts.newGuests)} />
          <StatTile label="ALL ACCOUNTS" value={formatCount(accounts.totalAccounts)} />
          <StatTile label="ALL GUESTS" value={formatCount(accounts.totalGuests)} />
          <StatTile label="PROFILES MADE" value={formatCount(accounts.profiles)} />
        </div>
        <TrendChart
          title="New accounts per day"
          points={series((d) => d.accounts)}
          format={formatCount}
          colour={SERIES.aqua}
        />
      </Group>

      <Group title="Money and the shop">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="REVENUE" value={formatPence(money.revenuePence)} />
          <StatTile label="PURCHASES" value={formatCount(money.purchases)} />
          <StatTile
            label="CHECKOUT RATE"
            value={formatPercent(money.purchases, money.checkoutsStarted)}
            note={`${formatCount(money.checkoutsStarted)} checkouts opened`}
          />
          <StatTile
            label="REVENUE / PLAYER"
            value={
              game.activePlayers > 0 ? formatPence(money.revenuePence / game.activePlayers) : "-"
            }
          />
          <StatTile label="COINS EARNED" value={formatCount(money.coinsEarned)} />
          <StatTile label="COINS SPENT" value={formatCount(money.coinsSpent)} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <TrendChart
            title="Revenue per day"
            points={series((d) => d.revenuePence)}
            format={formatPence}
            colour={SERIES.orange}
          />
          <BarList
            title="Sales by product"
            rows={money.byProduct.map((row) => ({
              key: row.key,
              value: row.pence,
              detail: `${formatCount(row.count)} sold`,
            }))}
            format={formatPence}
            colour={SERIES.orange}
          />
        </div>
      </Group>

      <Group title="Community and events">
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="LEAGUES MADE" value={formatCount(social.leaguesCreated)} />
          <StatTile label="LEAGUE JOINS" value={formatCount(social.leagueJoins)} />
          <StatTile label="ANSWER REPORTS" value={formatCount(social.reports)} />
        </div>
        <BarList
          title="Events"
          rows={report.events.map((row) => ({
            key: row.key.replaceAll("_", " "),
            value: row.count,
            detail: `${formatCount(row.visitors)} visitors`,
          }))}
          format={formatCount}
        />
      </Group>

      <DailyTable report={report} />
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-pixel text-sm text-floodlight">{title.toUpperCase()}</h2>
      {children}
    </section>
  );
}

/** Each step as a share of the first, so drop-offs stand out. */
function Funnel({ steps }: { steps: readonly { label: string; value: number }[] }) {
  const first = steps[0]?.value ?? 0;
  return (
    <section className="pixel-panel flex flex-col gap-2 p-3">
      <h3 className="font-pixel text-[10px] text-chalk">FUNNEL</h3>
      <ol className="flex flex-col gap-1.5">
        {steps.map((step) => (
          <li key={step.label} className="relative flex items-center gap-2 px-2 py-1 text-lg">
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-r"
              style={{
                width: `${first > 0 ? Math.max(2, Math.min(100, (100 * step.value) / first)) : 2}%`,
                backgroundColor: SERIES.blue,
                opacity: 0.25,
              }}
            />
            <span className="relative flex-1">{step.label}</span>
            <span className="relative tabular-nums">
              {formatCount(step.value)}{" "}
              <span className="text-chalk-dim">{formatPercent(step.value, first)}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Every day's figures as a table, with a CSV download, for anything the charts miss. */
function DailyTable({ report }: { report: AnalyticsReport }) {
  const rows = report.daily.map((day) => ({
    day: day.day,
    visitors: day.visitors,
    pageviews: day.pageviews,
    engaged_minutes: Math.round(day.engagedMs / 60000),
    players: day.players,
    rounds_started: day.roundsStarted,
    rounds_finished: day.roundsCompleted,
    new_accounts: day.accounts,
    new_guests: day.guests,
    revenue_gbp: (day.revenuePence / 100).toFixed(2),
  }));

  function download() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${report.from}-to-${report.to}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const columns = Object.keys(rows[0] ?? {});
  return (
    <details className="pixel-panel p-3">
      <summary className="cursor-pointer font-pixel text-[10px] text-chalk">
        DAY BY DAY TABLE
      </summary>
      <button type="button" onClick={download} className="pixel-button my-3 px-3 py-2 text-[10px]">
        DOWNLOAD CSV
      </button>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-lg tabular-nums">
          <thead>
            <tr className="text-chalk-dim">
              {columns.map((column) => (
                <th key={column} className="px-2 py-1 font-normal whitespace-nowrap">
                  {column.replaceAll("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((row) => (
              <tr key={row.day} className="border-t border-chalk-dim/20">
                {columns.map((column) => (
                  <td key={column} className="px-2 py-1 whitespace-nowrap">
                    {String(row[column as keyof typeof row])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
