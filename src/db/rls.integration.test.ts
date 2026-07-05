// @vitest-environment node
//
// Défense en profondeur : ces tests attaquent la base avec la connexion du
// rôle applicatif (stockflow_app) SANS passer par la couche applicative —
// exactement ce que ferait un attaquant ayant compromis le serveur app ou
// contourné les middlewares. C'est Postgres (RLS + grants par colonnes) qui
// doit bloquer, pas le code TypeScript.
//
// Nécessite APP_POSTGRES_URL (skippé sinon, ex. en CI sans secrets).
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../lib/auth-core";

const APP_URL = process.env.APP_POSTGRES_URL;

type Claims = { userId: string; role: "admin" | "technician" } | null;

const FIXTURE_EQUIPMENT_ID = "rls-test-equipment-001";
const FIXTURE_EQUIPMENT_ASSIGNED_ID = "rls-test-equipment-002";
const FIXTURE_USER_ID = "rls-test-user-001";
const FIXTURE_USER_EMAIL = "rls-test@example.com";
const FIXTURE_USER_PASSWORD = "rls-test-password-123";

describe.skipIf(!APP_URL)("RLS — défense en profondeur", () => {
	let pool: pg.Pool;

	// Exécute une requête dans une transaction, avec ou sans claims posés.
	// ROLLBACK par défaut : les tentatives d'écriture ne laissent aucun résidu.
	async function run(
		claims: Claims,
		text: string,
		params: unknown[] = [],
		commit = false,
	): Promise<pg.QueryResult> {
		const client = await pool.connect();
		try {
			await client.query("BEGIN");
			if (claims) {
				await client.query(
					"SELECT set_config('app.user_id', $1, true), set_config('app.role', $2, true)",
					[claims.userId, claims.role],
				);
			}
			const result = await client.query(text, params);
			await client.query(commit ? "COMMIT" : "ROLLBACK");
			return result;
		} catch (err) {
			await client.query("ROLLBACK").catch(() => {});
			throw err;
		} finally {
			client.release();
		}
	}

	const admin: Claims = { userId: "rls-test-admin", role: "admin" };
	const tech: Claims = { userId: FIXTURE_USER_ID, role: "technician" };

	beforeAll(async () => {
		if (!APP_URL) return;
		pool = new pg.Pool({
			connectionString: APP_URL.replace(/([?&])sslmode=[^&]*/g, "$1").replace(
				/[?&]$/,
				"",
			),
			ssl: { rejectUnauthorized: false },
			max: 2,
		});
		// Fixtures posées avec claims admin (les policies l'autorisent).
		await run(
			admin,
			`INSERT INTO equipment (id, name, type, qr_code) VALUES ($1, 'RLS fixture', 'pc', $1)
			 ON CONFLICT (id) DO NOTHING`,
			[FIXTURE_EQUIPMENT_ID],
			true,
		);
		await run(
			admin,
			`INSERT INTO users (id, name, email, role, password_hash, created_at)
			 VALUES ($1, 'RLS Test', $2, 'technician', $3, NOW())
			 ON CONFLICT (id) DO NOTHING`,
			[FIXTURE_USER_ID, FIXTURE_USER_EMAIL, await hashPassword(FIXTURE_USER_PASSWORD)],
			true,
		);
		// Équipement assigné au technicien de test (FK users → inséré après lui).
		await run(
			admin,
			`INSERT INTO equipment (id, name, type, qr_code, status, assigned_to)
			 VALUES ($1, 'RLS fixture assignée', 'pc', $1, 'assigned', $2)
			 ON CONFLICT (id) DO NOTHING`,
			[FIXTURE_EQUIPMENT_ASSIGNED_ID, FIXTURE_USER_ID],
			true,
		);
	}, 30_000);

	afterAll(async () => {
		if (!pool) return;
		await run(
			admin,
			"DELETE FROM equipment WHERE id IN ($1, $2)",
			[FIXTURE_EQUIPMENT_ID, FIXTURE_EQUIPMENT_ASSIGNED_ID],
			true,
		);
		await run(admin, "DELETE FROM users WHERE id = $1", [FIXTURE_USER_ID], true);
		await pool.end();
	}, 30_000);

	describe("sans claims (couche applicative contournée)", () => {
		it("ne voit aucune ligne equipment", async () => {
			const r = await run(null, "SELECT * FROM equipment");
			expect(r.rowCount).toBe(0);
		});

		it("ne voit aucune ligne users", async () => {
			const r = await run(null, "SELECT id, email FROM users");
			expect(r.rowCount).toBe(0);
		});

		it("ne peut pas insérer d'equipment", async () => {
			await expect(
				run(null, "INSERT INTO equipment (id, name, type, qr_code) VALUES ('x', 'x', 'pc', 'x')"),
			).rejects.toThrow(/row-level security/i);
		});

		it("ne peut pas modifier l'equipment existant (0 ligne touchée)", async () => {
			const r = await run(null, "UPDATE equipment SET status = 'broken' WHERE id = $1", [
				FIXTURE_EQUIPMENT_ID,
			]);
			expect(r.rowCount).toBe(0);
		});
	});

	describe("claims technician", () => {
		it("lit et modifie equipment", async () => {
			const r = await run(tech, "SELECT * FROM equipment WHERE id = $1", [FIXTURE_EQUIPMENT_ID]);
			expect(r.rowCount).toBe(1);
			const u = await run(tech, "UPDATE equipment SET status = 'maintenance' WHERE id = $1", [
				FIXTURE_EQUIPMENT_ID,
			]);
			expect(u.rowCount).toBe(1);
		});

		it("ne peut pas supprimer equipment (réservé admin)", async () => {
			const r = await run(tech, "DELETE FROM equipment WHERE id = $1", [FIXTURE_EQUIPMENT_ID]);
			expect(r.rowCount).toBe(0);
		});

		it("ne lit que sa propre ligne users", async () => {
			const r = await run(tech, "SELECT id FROM users");
			expect(r.rows.map((row) => row.id)).toEqual([FIXTURE_USER_ID]);
		});

		it("ne peut jamais lire password_hash, même sur sa propre ligne", async () => {
			await expect(
				run(tech, "SELECT password_hash FROM users WHERE id = $1", [FIXTURE_USER_ID]),
			).rejects.toThrow(/permission denied/i);
		});

		it("ne peut pas créer d'utilisateur (réservé admin)", async () => {
			await expect(
				run(
					tech,
					`INSERT INTO users (id, name, email, role, password_hash, created_at)
					 VALUES ('rls-test-intrus', 'Intrus', 'intrus@example.com', 'admin', 'x', NOW())`,
				),
			).rejects.toThrow(/row-level security/i);
		});
	});

	describe("claims technician — déclaration d'incident", () => {
		// Les deux cas sont légitimes : la policy incidents_insert n'a aucun
		// filtre de propriété (rôle technician/admin suffit). Un technicien
		// signale une panne sur SON poste comme sur un équipement du stock.
		it("peut créer un incident sur un équipement qui lui est assigné", async () => {
			const r = await run(
				tech,
				`INSERT INTO incidents (id, equipment_id, reported_by, description, status, created_at)
				 VALUES ('rls-test-incident-a', $1, $2, 'panne poste assigné', 'open', NOW())`,
				[FIXTURE_EQUIPMENT_ASSIGNED_ID, FIXTURE_USER_ID],
			);
			expect(r.rowCount).toBe(1);
		});

		it("peut créer un incident sur un équipement non assigné", async () => {
			const r = await run(
				tech,
				`INSERT INTO incidents (id, equipment_id, reported_by, description, status, created_at)
				 VALUES ('rls-test-incident-b', $1, $2, 'panne équipement en stock', 'open', NOW())`,
				[FIXTURE_EQUIPMENT_ID, FIXTURE_USER_ID],
			);
			expect(r.rowCount).toBe(1);
		});
	});

	describe("claims admin", () => {
		it("peut supprimer equipment (rollback, fixture conservée)", async () => {
			const r = await run(admin, "DELETE FROM equipment WHERE id = $1", [FIXTURE_EQUIPMENT_ID]);
			expect(r.rowCount).toBe(1);
		});

		it("voit tous les users mais pas password_hash (grant par colonnes)", async () => {
			const r = await run(admin, "SELECT id FROM users");
			expect(r.rowCount).toBeGreaterThanOrEqual(1);
			await expect(run(admin, "SELECT password_hash FROM users")).rejects.toThrow(
				/permission denied/i,
			);
		});
	});

	describe("flux login via SECURITY DEFINER (seul accès au hash)", () => {
		it("auth_login_lookup fonctionne sans claims et permet la vérification argon2", async () => {
			const r = await run(null, "SELECT * FROM auth_login_lookup($1)", [FIXTURE_USER_EMAIL]);
			expect(r.rowCount).toBe(1);
			expect(await verifyPassword(r.rows[0].password_hash, FIXTURE_USER_PASSWORD)).toBe(true);
			expect(await verifyPassword(r.rows[0].password_hash, "mauvais mot de passe")).toBe(false);
		});

		it("auth_login_lookup ne renvoie rien pour un email inconnu", async () => {
			const r = await run(null, "SELECT * FROM auth_login_lookup('inconnu@example.com')");
			expect(r.rowCount).toBe(0);
		});
	});
});
