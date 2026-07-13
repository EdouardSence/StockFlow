import { Kysely, PostgresDialect, sql, type Transaction } from "kysely";
import pg from "pg";
import type { SessionUser } from "../lib/auth-core";
import type { Database } from "./types";

// Return timestamps as ISO strings instead of Date objects
pg.types.setTypeParser(1114, (str: string) => str);
pg.types.setTypeParser(1184, (str: string) => str);

// Runtime : rôle applicatif `stockflow_app` (APP_POSTGRES_URL), soumis à RLS.
// POSTGRES_URL/DATABASE_URL (rôle postgres, BYPASSRLS) ne servent qu'aux
// migrations/seeds. Pas de fallback silencieux : un déploiement qui oublie
// APP_POSTGRES_URL désactiverait toute la RLS sans la moindre erreur.
const rawUrl = process.env.APP_POSTGRES_URL;
if (!rawUrl) {
	throw new Error(
		"APP_POSTGRES_URL manquant : le runtime ne doit jamais se connecter " +
			"avec POSTGRES_URL/DATABASE_URL (rôle postgres, BYPASSRLS), réservé aux migrations/seeds.",
	);
}

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
/**
 * Une erreur Postgres brute (SQLSTATE + severity) exposerait noms de tables,
 * colonnes ou contraintes au client (F11, issue #8). Les erreurs métier
 * (Error/AuthError jetées par les handlers) ne matchent pas et passent telles
 * quelles.
 */
export function isPgError(err: unknown): boolean {
	return (
		typeof err === "object" &&
		err !== null &&
		"severity" in err &&
		"code" in err &&
		typeof (err as { code: unknown }).code === "string" &&
		/^[0-9A-Z]{5}$/.test((err as { code: string }).code)
	);
}

export async function withAuthContext<T>(
	user: Pick<SessionUser, "id" | "role">,
	fn: (trx: Transaction<Database>) => Promise<T>,
): Promise<T> {
	try {
		return await db.transaction().execute(async (trx) => {
			await sql`SELECT set_config('app.user_id', ${user.id}, true), set_config('app.role', ${user.role}, true)`.execute(
				trx,
			);
			return fn(trx);
		});
	} catch (err) {
		if (isPgError(err)) {
			// Détail complet côté serveur (logs Vercel), message générique côté client.
			console.error("[db] erreur Postgres masquée au client :", err);
			throw new Error(
				"Opération impossible. Réessayez ou contactez un administrateur.",
			);
		}
		throw err;
	}
}
