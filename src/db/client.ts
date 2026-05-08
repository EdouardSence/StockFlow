import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "./types";

// Return timestamps as ISO strings instead of Date objects
pg.types.setTypeParser(1114, (str: string) => str);
pg.types.setTypeParser(1184, (str: string) => str);

const pool = new pg.Pool({
	connectionString: process.env.POSTGRES_URL ?? process.env.DATABASE_URL,
	max: 10,
});

export const db = new Kysely<Database>({
	dialect: new PostgresDialect({ pool }),
});
