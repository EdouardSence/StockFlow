// Crée (ou met à jour) un compte admin. Pas d'inscription publique : les
// comptes naissent ici ou via l'UI admin à venir.
//
// Usage : bun run scripts/seed-admin.ts <email> <mot_de_passe> [nom]
//         (ou via env : ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME)
//
// Fonctionne avec APP_POSTGRES_URL (rôle app) : le script pose les claims
// admin en transaction, exactement comme le runtime — les policies RLS
// s'appliquent, pas de bypass.
import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "../src/lib/auth-core";

const email = process.env.ADMIN_EMAIL ?? process.argv[2];
const password = process.env.ADMIN_PASSWORD ?? process.argv[3];
const name = process.env.ADMIN_NAME ?? process.argv[4] ?? "Administrateur";

if (!email || !password) {
	console.error(
		"Usage: bun run scripts/seed-admin.ts <email> <mot_de_passe> [nom]",
	);
	process.exit(1);
}
if (password.length < 12) {
	console.error("Mot de passe trop court : 12 caractères minimum.");
	process.exit(1);
}

const url =
	process.env.APP_POSTGRES_URL ??
	process.env.POSTGRES_URL ??
	process.env.DATABASE_URL;
if (!url) throw new Error("APP_POSTGRES_URL / POSTGRES_URL manquant");

const client = new pg.Client({
	connectionString: url.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, ""),
	ssl: { rejectUnauthorized: false },
});
await client.connect();

const passwordHash = await hashPassword(password);

await client.query("BEGIN");
await client.query(
	"SELECT set_config('app.role', 'admin', true), set_config('app.user_id', 'seed-script', true)",
);
// Pas de ON CONFLICT DO UPDATE : il exigerait SELECT sur password_hash
// (lecture d'EXCLUDED), que le grant par colonnes interdit volontairement.
const updated = await client.query(
	"UPDATE users SET password_hash = $1, name = $2 WHERE lower(email) = lower($3)",
	[passwordHash, name, email],
);
if (updated.rowCount === 0) {
	await client.query(
		`INSERT INTO users (id, name, email, role, password_hash, created_at)
		 VALUES ($1, $2, lower($3), 'admin', $4, NOW())`,
		[uuidv4(), name, email, passwordHash],
	);
}
await client.query("COMMIT");
await client.end();

console.log(`Compte admin prêt pour ${email.toLowerCase()}.`);
