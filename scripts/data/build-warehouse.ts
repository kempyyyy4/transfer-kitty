/**
 * Loads the downloaded Transfermarkt tables into the local warehouse.
 * Run "npm run data:download" first. Safe to re-run: each table is rebuilt from scratch.
 */
import { createReadStream, existsSync } from "node:fs";
import { createGunzip } from "node:zlib";
import type { SQLInputValue } from "node:sqlite";
import { parseCsv } from "./csv";
import { TRANSFERMARKT_TABLES, transfermarktFile, type TransfermarktTable } from "./sources";
import { TABLE_COLUMNS, TABLE_INDEXES, type ColumnType } from "./tables";
import { openWarehouse, type Warehouse } from "./warehouse";

function convert(value: string | undefined, type: ColumnType): SQLInputValue {
  if (value === undefined || value === "") return null;
  if (type === "text") return value;

  const number = Number(value);
  if (Number.isNaN(number)) return null;
  return type === "integer" ? Math.trunc(number) : number;
}

function columnPositions(table: TransfermarktTable, header: string[]): number[] {
  return Object.keys(TABLE_COLUMNS[table]).map((column) => {
    const position = header.indexOf(column);
    if (position === -1) throw new Error(`${table}: the download has no "${column}" column`);
    return position;
  });
}

async function loadTable(warehouse: Warehouse, table: TransfermarktTable): Promise<number> {
  const file = transfermarktFile(table);
  if (!existsSync(file)) {
    throw new Error(`${table}: ${file} is missing. Run "npm run data:download" first.`);
  }

  const columns = Object.entries(TABLE_COLUMNS[table]);
  const types = columns.map(([, type]) => type);
  const definitions = columns.map(([name, type]) => `${name} ${type}`).join(", ");
  warehouse.run(`drop table if exists tm_${table}; create table tm_${table} (${definitions})`);

  const insert = warehouse.inserter(`tm_${table}`, columns.length);
  const text = createReadStream(file).pipe(createGunzip()).setEncoding("utf8");
  let positions: number[] | undefined;
  let rowCount = 0;

  await warehouse.transaction(async () => {
    for await (const row of parseCsv(text)) {
      if (!positions) {
        positions = columnPositions(table, row);
        continue;
      }
      const found = positions;
      insert(types.map((type, index) => convert(row[found[index] ?? -1], type)));
      rowCount++;
    }
  });

  for (const indexColumns of TABLE_INDEXES[table] ?? []) {
    warehouse.run(
      `create index tm_${table}_${indexColumns.join("_")} on tm_${table} (${indexColumns.join(", ")})`,
    );
  }
  return rowCount;
}

const warehouse = openWarehouse();
for (const table of TRANSFERMARKT_TABLES) {
  const started = Date.now();
  const rowCount = await loadTable(warehouse, table);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`tm_${table}: ${rowCount.toLocaleString("en-GB")} rows in ${seconds}s`);
}
warehouse.close();
