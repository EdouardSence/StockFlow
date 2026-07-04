import { Kysely, PostgresDialect, type Transaction, sql } from "kysely";
import pg from "pg";
import type { SessionUser } from "../lib/auth-core";
import type { Database } from "./types";

// Return timestamps as ISO strings instead of Date objects
pg.types.setTypeParser(1114, (str: string) => str);
pg.types.setTypeParser(1184, (str: string) => str);

// Runtime : rôle applicatif `stockflow_app` (APP_POSTGRES_URL), soumis à RLS.
// POSTGRES_URL/DATABASE_URL (rôle postgres, BYPASSRLS) ne servent qu'aux
// migrations/seeds — si l'app tourne avec, le test d'intégration RLS échoue.
const rawUrl =
	process.env.APP_POSTGRES_URL ??
	process.env.POSTGRES_URL ??
	process.env.DATABASE_URL ??
	"";

// Strip sslmode from URL so our explicit ssl config wins (Supabase pooler uses self-signed cert)
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

/**
 * Exécute `fn` dans une transaction où l'identité vérifiée du JWT est posée en
 * paramètres de session Postgres (SET LOCAL via set_config(..., true)). Les
 * policies RLS lisent current_setting('app.user_id'/'app.role').
 *
 * Fail-closed : toute requête hors de ce wrapper n'a aucun claim posé, donc
 * les policies RLS refusent l'accès.
 */
export async function withAuthContext<T>(
	user: Pick<SessionUser, "id" | "role">,
	fn: (trx: Transaction<Database>) => Promise<T>,
): Promise<T> {
	return db.transaction().execute(async (trx) => {
		await sql`SELECT set_config('app.user_id', ${user.id}, true), set_config('app.role', ${user.role}, true)`.execute(
			trx,
		);
		return fn(trx);
	});
}
