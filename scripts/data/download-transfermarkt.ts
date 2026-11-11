/**
 * Downloads the Transfermarkt dataset tables the generator uses.
 * npm run data:download              every table not yet downloaded
 * npm run data:download -- transfers only the named tables
 * Add --force to download again even if the file exists.
 */
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import {
  TRANSFERMARKT_BASE_URL,
  TRANSFERMARKT_DIR,
  TRANSFERMARKT_TABLES,
  transfermarktFile,
  type TransfermarktTable,
} from "./sources";

const args = process.argv.slice(2);
const force = args.includes("--force");
const requested = args.filter((arg) => !arg.startsWith("--"));

function tablesToDownload(): TransfermarktTable[] {
  if (requested.length === 0) return [...TRANSFERMARKT_TABLES];

  const unknown = requested.filter((name) => !isTable(name));
  if (unknown.length > 0) {
    throw new Error(`Unknown table: ${unknown.join(", ")}. Known: ${TRANSFERMARKT_TABLES.join(", ")}`);
  }
  return requested.filter(isTable);
}

function isTable(name: string): name is TransfermarktTable {
  return (TRANSFERMARKT_TABLES as readonly string[]).includes(name);
}

async function download(table: TransfermarktTable): Promise<void> {
  const target = transfermarktFile(table);
  if (existsSync(target) && !force) {
    console.log(`${table}: already downloaded (${formatSize(statSync(target).size)})`);
    return;
  }

  const response = await fetch(`${TRANSFERMARKT_BASE_URL}/${table}.csv.gz`);
  if (!response.ok || !response.body) {
    throw new Error(`${table}: download failed with HTTP ${response.status}`);
  }

  // Write to a temporary name first so an interrupted download is never mistaken for a full file.
  const partial = `${target}.part`;
  // The browser and Node type declarations for the same stream differ, hence the cast.
  const body = response.body as WebReadableStream<Uint8Array>;
  await pipeline(Readable.fromWeb(body), createWriteStream(partial));
  renameSync(partial, target);
  console.log(`${table}: downloaded (${formatSize(statSync(target).size)})`);
}

function formatSize(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

mkdirSync(TRANSFERMARKT_DIR, { recursive: true });
for (const table of tablesToDownload()) {
  await download(table);
}
