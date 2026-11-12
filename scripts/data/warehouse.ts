import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { WAREHOUSE_PATH } from "./sources";

export type Row = Record<string, unknown>;

export interface Warehouse {
  run(sql: string): void;
  query<T extends object = Row>(sql: string, ...params: SQLInputValue[]): T[];
  /** Runs `work` inside one transaction, which makes bulk inserts fast. */
  transaction(work: () => Promise<void>): Promise<void>;
  inserter(table: string, columnCount: number): (values: SQLInputValue[]) => void;
  close(): void;
}

/**
 * Opens the local SQLite file that holds the downloaded data and everything derived from it.
 * SQLite ships with Node, so the data tools need nothing installed beyond the project itself.
 */
export function openWarehouse(): Warehouse {
  mkdirSync(path.dirname(WAREHOUSE_PATH), { recursive: true });
  const db = new DatabaseSync(WAREHOUSE_PATH);

  return {
    run(sql) {
      db.exec(sql);
    },
    query<T extends object>(sql: string, ...params: SQLInputValue[]) {
      return db.prepare(sql).all(...params) as T[];
    },
    async transaction(work) {
      db.exec("begin");
      try {
        await work();
        db.exec("commit");
      } catch (error) {
        db.exec("rollback");
        throw error;
      }
    },
    inserter(table, columnCount) {
      const placeholders = new Array(columnCount).fill("?").join(", ");
      const statement = db.prepare(`insert into ${table} values (${placeholders})`);
      return (values) => {
        statement.run(...values);
      };
    },
    close() {
      db.close();
    },
  };
}
