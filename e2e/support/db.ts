import pg from "pg";

/**
 * Convention de nommage stricte des données e2e : tout id/email/nom créé par
 * la suite porte ce préfixe. Distinctif et improbable à dessein — jamais un
 * simple "test-" (les fixtures RLS utilisent déjà "rls-test-", et la base est
 * partagée avec la prod : un motif trop générique pourrait matcher des données
 * réelles).
 */
export const E2E_PREFIX = "e2e-ephemeral-";

export const E2E_ADMIN = {
	id: `${E2E_PREFIX}admin`,
	name: "E2E Ephemeral Admin",
	email: `${E2E_PREFIX}admin@stockflow.test`,
	password: "e2e-ephemeral-Passw0rd!",
};

function makePool() {
	const url = process.env.APP_POSTGRES_URL;
	if (!url) throw new Error("APP_POSTGRES_URL manquant (voir .env.local)");
	return new pg.Pool({
		connectionString: url.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, ""),
		ssl: { rejectUnauthorized: false },
		max: 1,
	});
}

/** Exécute une requête avec claims admin posés (les policies RLS l'exigent). */
async function runAsAdmin(
	pool: pg.Pool,
	text: string,
	params: unknown[] = [],
): Promise<pg.QueryResult> {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		await client.query(
			"SELECT set_config('app.user_id', $1, true), set_config('app.role', 'admin', true)",
			[E2E_ADMIN.id],
		);
		const result = await client.query(text, params);
		await client.query("COMMIT");
		return result;
	} catch (err) {
		await client.query("ROLLBACK").catch(() => {});
		throw err;
	} finally {
		client.release();
	}
}

/**
 * Sweep : supprime toute donnée portant le préfixe e2e, dans l'ordre des FK.
 * Tourne AVANT la suite (restes d'un run précédent interrompu) ET APRÈS
 * (best-effort, globalTeardown). Ne matche que le préfixe strict — aucune
 * donnée réelle ne peut le porter par accident.
 */
export async function sweepEphemeralData(): Promise<Record<string, number>> {
	const pool = makePool();
	const like = `${E2E_PREFIX}%`;
	try {
		const deleted: Record<string, number> = {};
		const incidents = await runAsAdmin(
			pool,
			`DELETE FROM incidents
			 WHERE id LIKE $1 OR equipment_id LIKE $1 OR reported_by LIKE $1`,
			[like],
		);
		deleted.incidents = incidents.rowCount ?? 0;
		const equipment = await runAsAdmin(
			pool,
			"DELETE FROM equipment WHERE id LIKE $1 OR qr_code LIKE $1",
			[like],
		);
		deleted.equipment = equipment.rowCount ?? 0;
		// refresh_tokens : pas de grant DELETE pour stockflow_app (voulu — le
		// logout révoque par UPDATE). Inutile ici : FK ON DELETE CASCADE, la
		// suppression du user emporte ses tokens.
		const users = await runAsAdmin(
			pool,
			"DELETE FROM users WHERE id LIKE $1 OR email LIKE $1",
			[like],
		);
		deleted.users = users.rowCount ?? 0;
		return deleted;
	} finally {
		await pool.end();
	}
}

/** Crée le compte admin éphémère utilisé par les scénarios (login réel). */
export async function createEphemeralAdmin(passwordHash: string): Promise<void> {
	const pool = makePool();
	try {
		await runAsAdmin(
			pool,
			`INSERT INTO users (id, name, email, role, password_hash, created_at)
			 VALUES ($1, $2, $3, 'admin', $4, NOW())
			 ON CONFLICT (id) DO NOTHING`,
			[E2E_ADMIN.id, E2E_ADMIN.name, E2E_ADMIN.email, passwordHash],
		);
	} finally {
		await pool.end();
	}
}
