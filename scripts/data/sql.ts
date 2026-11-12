/**
 * Runs one SQL query against the local warehouse and prints the rows.
 * For exploring the data by hand: npm run data:sql -- "select count(*) from tm_players"
 */
import { openWarehouse } from "./warehouse";

const sql = process.argv[2];
if (!sql) {
  throw new Error('Pass a SQL query, for example: npm run data:sql -- "select 1"');
}

const warehouse = openWarehouse();
console.table(warehouse.query(sql));
warehouse.close();
