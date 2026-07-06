import { createHash, randomBytes } from "node:crypto";
import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import { SignJWT, importPKCS8, importSPKI, jwtVerify } from "jose";
import type { UsersTable } from "../db/types";

export type Role = UsersTable["role"];

export interface SessionUser {
	id: string;
	name: string;
	email: string;
	role: Role;
}

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const JWT_ISSUER = "stockflow";
const JWT_AUDIENCE = "stockflow-app";

/* ── Clés RS256 ─────────────────────────────────────────────────── */

export function decodePemFromEnv(b64: string): string {
	return Buffer.from(b64, "base64").toString("utf-8");
}

export async function importPrivateKey(pem: string) {
	return importPKCS8(pem, "RS256");
}

export async function importPublicKey(pem: string) {
	return importSPKI(pem, "RS256");
}

/* ── Access token (JWT RS256, 15 min) ───────────────────────────── */

export async function signAccessToken(
	user: SessionUser,
	privateKey: CryptoKey,
	ttlSeconds: number = ACCESS_TOKEN_TTL_SECONDS,
): Promise<string> {
	return new SignJWT({ role: user.role, name: user.name, email: user.email })
		.setProtectedHeader({ alg: "RS256", typ: "JWT" })
		.setSubject(user.id)
		.setIssuer(JWT_ISSUER)
		.setAudience(JWT_AUDIENCE)
		.setIssuedAt()
		.setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
		.sign(privateKey);
}

export async function verifyAccessToken(
	token: string,
	publicKey: CryptoKey,
): Promise<SessionUser | null> {
	try {
		const { payload } = await jwtVerify(token, publicKey, {
			algorithms: ["RS256"],
			issuer: JWT_ISSUER,
			audience: JWT_AUDIENCE,
		});
		if (
			typeof payload.sub !== "string" ||
			(payload.role !== "admin" && payload.role !== "technician") ||
			typeof payload.name !== "string" ||
			typeof payload.email !== "string"
		) {
			return null;
		}
		return {
			id: payload.sub,
			role: payload.role,
			name: payload.name,
			email: payload.email,
		};
	} catch {
		return null;
	}
}

/* ── Mots de passe (argon2id) ───────────────────────────────────── */

export async function hashPassword(password: string): Promise<string> {
	return argon2Hash(password);
}

export async function verifyPassword(
	passwordHash: string,
	password: string,
): Promise<boolean> {
	try {
		return await argon2Verify(passwordHash, password);
	} catch {
		return false;
	}
}

// Hash factice vérifié quand l'email est inconnu, pour égaliser le temps de
// réponse entre « email inconnu » et « mot de passe faux » (anti-énumération).
export const DUMMY_PASSWORD_HASH_PROMISE: Promise<string> = argon2Hash(
	"stockflow-dummy-timing-equalizer",
);

/* ── Refresh tokens (opaques, hashés en DB) ─────────────────────── */

export function generateRefreshToken(): string {
	return randomBytes(32).toString("base64url");
}

// SHA-256 suffit : le token a 256 bits d'entropie aléatoire, inutile de le
// traiter comme un mot de passe faible (pas de brute-force possible).
export function hashRefreshToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

/* ── RBAC ───────────────────────────────────────────────────────── */

export class AuthError extends Error {
	constructor(public code: "UNAUTHORIZED" | "FORBIDDEN") {
		super(code);
		this.name = "AuthError";
	}
}

export function assertRole(user: SessionUser | null, ...allowed: Role[]): SessionUser {
	if (!user) throw new AuthError("UNAUTHORIZED");
	if (!allowed.includes(user.role)) throw new AuthError("FORBIDDEN");
	return user;
}

/* ── Rate limiting (pur, horloge injectable pour les tests) ─────── */
// ponytail: limiteur en mémoire par instance — suffisant contre le brute-force
// naïf en mono-instance ; store partagé (Redis/DB) si multi-instance à fort trafic.

export function createLoginRateLimiter(
	max = 5,
	windowMs = 15 * 60 * 1000,
) {
	const attempts = new Map<string, { count: number; resetAt: number }>();
	return {
		isLimited(key: string, now: number = Date.now()): boolean {
			const entry = attempts.get(key);
			if (!entry || entry.resetAt < now) {
				if (entry) attempts.delete(key); // éviction des entrées expirées
				return false;
			}
			return entry.count >= max;
		},
		recordFailure(key: string, now: number = Date.now()): void {
			const entry = attempts.get(key);
			if (!entry || entry.resetAt < now) {
				attempts.set(key, { count: 1, resetAt: now + windowMs });
			} else {
				entry.count += 1;
			}
		},
		reset(key: string): void {
			attempts.delete(key);
		},
	};
}

/**
 * Limiteur à trois étages (issue #15) : la clé composite IP:email seule
 * laisse passer un brute-force distribué (N adresses IP × 5 essais sur un
 * même compte) et le credential stuffing (une IP balayant N emails).
 * - paire IP:email : strict (5), protège le cas nominal ;
 * - email seul : plafond global du compte quel que soit le nombre d'IPs —
 *   plus haut (20) pour ne pas offrir un déni de service au compte visé ;
 * - IP seule : plafond global d'une adresse quel que soit l'email (30).
 * `reset` (succès de login) ne vide que la paire : remettre à zéro les
 * étages email/IP permettrait à un attaquant de purger ses compteurs en
 * intercalant un succès sur son propre compte.
 */
export function createTieredLoginLimiter(
	windowMs = 15 * 60 * 1000,
	maxPerPair = 5,
	maxPerEmail = 20,
	maxPerIp = 30,
) {
	const perPair = createLoginRateLimiter(maxPerPair, windowMs);
	const perEmail = createLoginRateLimiter(maxPerEmail, windowMs);
	const perIp = createLoginRateLimiter(maxPerIp, windowMs);
	return {
		isLimited(ip: string, email: string, now: number = Date.now()): boolean {
			return (
				perPair.isLimited(`${ip}:${email}`, now) ||
				perEmail.isLimited(email, now) ||
				perIp.isLimited(ip, now)
			);
		},
		recordFailure(ip: string, email: string, now: number = Date.now()): void {
			perPair.recordFailure(`${ip}:${email}`, now);
			perEmail.recordFailure(email, now);
			perIp.recordFailure(ip, now);
		},
		reset(ip: string, email: string): void {
			perPair.reset(`${ip}:${email}`);
		},
	};
}
