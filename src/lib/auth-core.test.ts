// @vitest-environment node
// (jose exige des Uint8Array du realm natif — jsdom casse l'instanceof)
import { generateKeyPair } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import {
	AuthError,
	assertRole,
	createLoginRateLimiter,
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
		const tampered = JSON.parse(
			Buffer.from(payload, "base64url").toString(),
		);
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
