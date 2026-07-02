import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "./types";

// Return timestamps as ISO strings instead of Date objects
pg.types.setTypeParser(1114, (str: string) => str);
pg.types.setTypeParser(1184, (str: string) => str);

// Strip sslmode from URL so our explicit ssl config wins (Supabase pooler uses self-signed cert)
const rawUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";
const connectionString = rawUrl
	.replace(/([?&])sslmode=[^&]*/g, "$1")
	.replace(/[?&]$/, "");

const pool = new pg.Pool({
	connectionString,
	ssl: { rejectUnauthorized: false },
	max: 10,
});

export const db = new Kysely<Database>({
	dialect: new PostgresDialect({ pool }),
});
