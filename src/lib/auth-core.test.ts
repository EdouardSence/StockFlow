// @vitest-environment node
// (jose exige des Uint8Array du realm natif — jsdom casse l'instanceof)
import { generateKeyPair } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import {
	AuthError,
	assertRole,
	createLoginRateLimiter,
	createTieredLoginLimiter,
	generateRefreshToken,
	hashPassword,
	hashRefreshToken,
	type SessionUser,
	signAccessToken,
	verifyAccessToken,
	verifyPassword,
} from "./auth-core";

const user: SessionUser = {
	id: "user-1",
	name: "Test",
	email: "test@example.com",
	role: "technician",
};

let keys: { privateKey: CryptoKey; publicKey: CryptoKey };
let otherKeys: { privateKey: CryptoKey; publicKey: CryptoKey };

beforeAll(async () => {
	[keys, otherKeys] = (await Promise.all([
		generateKeyPair("RS256", { extractable: false }),
		generateKeyPair("RS256", { extractable: false }),
	])) as [typeof keys, typeof otherKeys];
});

describe("access token (JWT RS256)", () => {
	it("signe puis vérifie un token valide (login réussi)", async () => {
		const token = await signAccessToken(user, keys.privateKey);
		const verified = await verifyAccessToken(token, keys.publicKey);
		expect(verified).toEqual(user);
	});

	it("rejette un token expiré", async () => {
		const token = await signAccessToken(user, keys.privateKey, -10);
		expect(await verifyAccessToken(token, keys.publicKey)).toBeNull();
	});

	it("rejette un token signé avec une autre clé", async () => {
		const token = await signAccessToken(user, keys.privateKey);
		expect(await verifyAccessToken(token, otherKeys.publicKey)).toBeNull();
	});

	it("rejette un token altéré", async () => {
		const token = await signAccessToken(user, keys.privateKey);
		const [header, payload, sig] = token.split(".");
		const tampered = JSON.parse(Buffer.from(payload, "base64url").toString());
		tampered.role = "admin"; // tentative d'escalade de privilèges
		const forged = `${header}.${Buffer.from(JSON.stringify(tampered)).toString("base64url")}.${sig}`;
		expect(await verifyAccessToken(forged, keys.publicKey)).toBeNull();
	});

	it("rejette une chaîne arbitraire", async () => {
		expect(await verifyAccessToken("not-a-jwt", keys.publicKey)).toBeNull();
	});
});

describe("mots de passe (argon2id)", () => {
	it("vérifie le bon mot de passe (login réussi)", async () => {
		const hash = await hashPassword("correct horse battery staple");
		expect(hash).toMatch(/^\$argon2id\$/);
		expect(await verifyPassword(hash, "correct horse battery staple")).toBe(
			true,
		);
	});

	it("rejette un mauvais mot de passe (login échoué)", async () => {
		const hash = await hashPassword("correct horse battery staple");
		expect(await verifyPassword(hash, "wrong password")).toBe(false);
	});

	it("rejette sans lever sur un hash corrompu", async () => {
		expect(await verifyPassword("garbage", "anything")).toBe(false);
	});
});

describe("refresh tokens", () => {
	it("génère des tokens uniques à haute entropie", () => {
		const a = generateRefreshToken();
		const b = generateRefreshToken();
		expect(a).not.toBe(b);
		expect(a.length).toBeGreaterThanOrEqual(43); // 32 octets en base64url
	});

	it("hash de façon déterministe (lookup DB possible)", () => {
		const token = generateRefreshToken();
		expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
		expect(hashRefreshToken(token)).toHaveLength(64); // sha256 hex
	});
});

describe("RBAC — assertRole", () => {
	it("refuse un utilisateur non authentifié", () => {
		expect(() => assertRole(null, "technician")).toThrowError(
			expect.objectContaining({ code: "UNAUTHORIZED" }),
		);
	});

	it("refuse un rôle insuffisant (accès refusé par rôle)", () => {
		expect(() => assertRole(user, "admin")).toThrowError(
			expect.objectContaining({ code: "FORBIDDEN" }),
		);
	});

	it("accepte un rôle autorisé", () => {
		expect(assertRole(user, "technician", "admin")).toEqual(user);
	});

	it("AuthError expose un code exploitable", () => {
		const err = new AuthError("FORBIDDEN");
		expect(err.code).toBe("FORBIDDEN");
		expect(err.message).toBe("FORBIDDEN");
	});
});

describe("rate limiting login", () => {
	it("bloque après 5 échecs dans la fenêtre", () => {
		const limiter = createLoginRateLimiter(5, 60_000);
		const now = 1_000_000;
		for (let i = 0; i < 5; i++) {
			expect(limiter.isLimited("a@b.c", now)).toBe(false);
			limiter.recordFailure("a@b.c", now);
		}
		expect(limiter.isLimited("a@b.c", now)).toBe(true);
	});

	it("réinitialise après expiration de la fenêtre", () => {
		const limiter = createLoginRateLimiter(5, 60_000);
		const now = 1_000_000;
		for (let i = 0; i < 5; i++) limiter.recordFailure("a@b.c", now);
		expect(limiter.isLimited("a@b.c", now + 61_000)).toBe(false);
	});

	it("réinitialise au succès", () => {
		const limiter = createLoginRateLimiter(5, 60_000);
		const now = 1_000_000;
		for (let i = 0; i < 5; i++) limiter.recordFailure("a@b.c", now);
		limiter.reset("a@b.c");
		expect(limiter.isLimited("a@b.c", now)).toBe(false);
	});

	it("isole les clés entre elles", () => {
		const limiter = createLoginRateLimiter(5, 60_000);
		const now = 1_000_000;
		for (let i = 0; i < 5; i++) limiter.recordFailure("a@b.c", now);
		expect(limiter.isLimited("autre@b.c", now)).toBe(false);
	});
});

describe("createTieredLoginLimiter (issue #15)", () => {
	const T0 = 1_000_000;

	it("paire IP:email : bloquée à 5 échecs, l'email reste libre depuis une autre IP", () => {
		const l = createTieredLoginLimiter();
		for (let i = 0; i < 5; i++) l.recordFailure("1.1.1.1", "a@x.fr", T0);
		expect(l.isLimited("1.1.1.1", "a@x.fr", T0)).toBe(true);
		expect(l.isLimited("2.2.2.2", "a@x.fr", T0)).toBe(false);
	});

	it("brute-force distribué : 20 échecs sur un email via 20 IPs → 21e IP bloquée aussi", () => {
		const l = createTieredLoginLimiter();
		for (let i = 0; i < 20; i++)
			l.recordFailure(`10.0.0.${i}`, "cible@x.fr", T0);
		expect(l.isLimited("99.99.99.99", "cible@x.fr", T0)).toBe(true);
		// Un autre compte n'est pas affecté depuis une IP vierge.
		expect(l.isLimited("99.99.99.99", "autre@x.fr", T0)).toBe(false);
	});

	it("credential stuffing : 30 échecs d'une IP sur 30 emails → IP bloquée pour tout email", () => {
		const l = createTieredLoginLimiter();
		for (let i = 0; i < 30; i++) l.recordFailure("6.6.6.6", `u${i}@x.fr`, T0);
		expect(l.isLimited("6.6.6.6", "jamais-vu@x.fr", T0)).toBe(true);
		expect(l.isLimited("7.7.7.7", "u1@x.fr", T0)).toBe(false);
	});

	it("le succès ne purge que la paire, pas les compteurs email/IP", () => {
		const l = createTieredLoginLimiter();
		for (let i = 0; i < 19; i++)
			l.recordFailure(`10.0.0.${i}`, "cible@x.fr", T0);
		l.reset("10.0.0.1", "cible@x.fr");
		l.recordFailure("10.0.0.50", "cible@x.fr", T0);
		// 20 échecs cumulés sur l'email malgré le reset intermédiaire.
		expect(l.isLimited("11.11.11.11", "cible@x.fr", T0)).toBe(true);
	});

	it("les fenêtres expirent : plus limité après windowMs", () => {
		const l = createTieredLoginLimiter(1000);
		for (let i = 0; i < 5; i++) l.recordFailure("1.1.1.1", "a@x.fr", T0);
		expect(l.isLimited("1.1.1.1", "a@x.fr", T0)).toBe(true);
		expect(l.isLimited("1.1.1.1", "a@x.fr", T0 + 1001)).toBe(false);
	});
});
