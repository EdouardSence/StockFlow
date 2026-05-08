import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = new pg.Client({ connectionString: url });
await client.connect();

const sql = readFileSync(
	join(import.meta.dirname, "../src/db/migrations/001_init.sql"),
	"utf-8",
);

await client.query(sql);
await client.end();

console.log("Migration applied successfully.");
