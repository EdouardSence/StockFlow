import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = new pg.Client({ connectionString: url });
await client.connect();

const dir = join(import.meta.dirname, "../src/db/migrations");
const files = readdirSync(dir)
	.filter((f) => f.endsWith(".sql"))
	.sort();

for (const file of files) {
	const sql = readFileSync(join(dir, file), "utf-8");
	await client.query(sql);
	console.log(`Applied ${file}`);
}

await client.end();

console.log("Migration applied successfully.");
