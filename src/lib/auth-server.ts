// Code serveur pur : ce module ne doit JAMAIS être importé statiquement par un
// fichier atteignable par le bundle client (routes, composants, auth.ts). Les
// server functions l'importent dynamiquement dans leurs handlers, qui sont
// éliminés du client par le splitter TanStack Start.
import {
	deleteCookie,
	getCookie,
	getRequestIP,
	setCookie,
} from "@tanstack/react-start/server";
import { sql } from "kysely";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client";
import {
	ACCESS_TOKEN_TTL_SECONDS,
	DUMMY_PASSWORD_HASH_PROMISE,
	REFRESH_TOKEN_TTL_SECONDS,
	type Role,
	type SessionUser,
	createTieredLoginLimiter,
	decodePemFromEnv,
	generateRefreshToken,
	hashRefreshToken,
	importPrivateKey,
	importPublicKey,
	signAccessToken,
	verifyAccessToken,
	verifyPassword,
} from "./auth-core";

const ACCESS_COOKIE = "sf_access";
const REFRESH_COOKIE = "sf_refresh";
// Fenêtre de grâce après rotation : un refresh token tout juste tourné peut
// encore émettre un access token (requêtes parallèles), au-delà = vol présumé.
const ROTATION_GRACE_MS = 10_000;

/* ── Clés (chargées une fois depuis l'env) ──────────────────────── */

let keysPromise: Promise<{
	privateKey: CryptoKey;
	publicKey: CryptoKey;
}> | null = null;

function getKeys() {
	if (!keysPromise) {
		const priv = process.env.JWT_PRIVATE_KEY;
		const pub = process.env.JWT_PUBLIC_KEY;
		if (!priv || !pub) {
			throw new Error("JWT_PRIVATE_KEY / JWT_PUBLIC_KEY manquants dans l'env");
		}
		keysPromise = Promise.all([
			importPrivateKey(decodePemFromEnv(priv)),
			importPublicKey(decodePemFromEnv(pub)),
		]).then(([privateKey, publicKey]) => ({ privateKey, publicKey }));
	}
	return keysPromise;
}

/* ── Cookies ────────────────────────────────────────────────────── */

function cookieOptions(maxAge: number) {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict" as const,
		path: "/",
		maxAge,
	};
}

async function issueSession(user: SessionUser): Promise<void> {
	const { privateKey } = await getKeys();
	const accessToken = await signAccessToken(user, privateKey);
	const refreshToken = generateRefreshToken();
	await db
		.insertInto("refresh_tokens")
		.values({
			id: uuidv4(),
			user_id: user.id,
			token_hash: hashRefreshToken(refreshToken),
			expires_at: new Date(
				Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
			).toISOString(),
			revoked_at: null,
			created_at: new Date().toISOString(),
		})
		.execute();
	setCookie(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_TOKEN_TTL_SECONDS));
	setCookie(
		REFRESH_COOKIE,
		refreshToken,
		cookieOptions(REFRESH_TOKEN_TTL_SECONDS),
	);
}

function clearAuthCookies() {
	deleteCookie(ACCESS_COOKIE, { path: "/" });
	deleteCookie(REFRESH_COOKIE, { path: "/" });
}

/* ── Lookups via fonctions SECURITY DEFINER ─────────────────────── */
// Le rôle applicatif n'a pas le droit de lire users.password_hash directement
// (grant par colonnes) : le flux de login passe par auth_login_lookup, détenue
// par postgres, seule à voir le hash.

interface LoginLookupRow {
	id: string;
	name: string;
	email: string;
	role: Role;
	password_hash: string | null;
}

async function loginLookup(email: string): Promise<LoginLookupRow | null> {
	const result = await sql<LoginLookupRow>`
		SELECT id, name, email, role, password_hash FROM auth_login_lookup(${email})
	`.execute(db);
	return result.rows[0] ?? null;
}

async function refreshLookup(userId: string): Promise<SessionUser | null> {
	const result = await sql<SessionUser>`
		SELECT id, name, email, role FROM auth_refresh_lookup(${userId})
	`.execute(db);
	return result.rows[0] ?? null;
}

/* ── Refresh avec rotation + détection de réutilisation ─────────── */

async function tryRefresh(): Promise<SessionUser | null> {
	const token = getCookie(REFRESH_COOKIE);
	if (!token) return null;

	const row = await db
		.selectFrom("refresh_tokens")
		.selectAll()
		.where("token_hash", "=", hashRefreshToken(token))
		.executeTakeFirst();
	if (!row) return null;

	if (row.revoked_at) {
		const revokedAgo = Date.now() - new Date(row.revoked_at).getTime();
		if (revokedAgo > ROTATION_GRACE_MS) {
			// Réutilisation d'un token tourné depuis longtemps : vol présumé,
			// on révoque toute la famille de tokens de l'utilisateur.
			await db
				.updateTable("refresh_tokens")
				.set({ revoked_at: new Date().toISOString() })
				.where("user_id", "=", row.user_id)
				.where("revoked_at", "is", null)
				.execute();
			clearAuthCookies();
			return null;
		}
		// Fenêtre de grâce : requêtes parallèles pendant la rotation. On émet un
		// access token frais sans nouvelle rotation — sauf si le token était de
		// toute façon déjà expiré (7 j) au moment de sa révocation.
		if (new Date(row.expires_at).getTime() < Date.now()) return null;
		const user = await refreshLookup(row.user_id);
		if (!user) return null;
		const { privateKey } = await getKeys();
		setCookie(
			ACCESS_COOKIE,
			await signAccessToken(user, privateKey),
			cookieOptions(ACCESS_TOKEN_TTL_SECONDS),
		);
		return user;
	}

	if (new Date(row.expires_at).getTime() < Date.now()) return null;

	const user = await refreshLookup(row.user_id);
	if (!user) return null;

	// Rotation : révoque l'ancien, émet une nouvelle paire access+refresh.
	// UPDATE conditionné sur revoked_at IS NULL (compare-and-swap) : si deux
	// requêtes concurrentes présentent le même token, une seule gagne la
	// rotation ; l'autre (numUpdatedRows=0) retombe en grâce sans dupliquer de
	// session ni laisser de refresh token orphelin.
	const { numUpdatedRows } = await db
		.updateTable("refresh_tokens")
		.set({ revoked_at: new Date().toISOString() })
		.where("id", "=", row.id)
		.where("revoked_at", "is", null)
		.executeTakeFirst();
	if (numUpdatedRows === 0n) {
		setCookie(
			ACCESS_COOKIE,
			await signAccessToken(user, (await getKeys()).privateKey),
			cookieOptions(ACCESS_TOKEN_TTL_SECONDS),
		);
		return user;
	}
	await issueSession(user);
	return user;
}

/* ── Résolution de session (access → refresh → null) ────────────── */

export async function resolveSession(): Promise<SessionUser | null> {
	const accessToken = getCookie(ACCESS_COOKIE);
	if (accessToken) {
		const { publicKey } = await getKeys();
		const user = await verifyAccessToken(accessToken, publicKey);
		if (user) return user;
	}
	return tryRefresh();
}

/* ── Login / logout ─────────────────────────────────────────────── */

const loginLimiter = createTieredLoginLimiter();
const GENERIC_LOGIN_ERROR = "Email ou mot de passe incorrect.";

export async function doLogin(data: {
	email: string;
	password: string;
}): Promise<SessionUser> {
	// Trois étages (cf. createTieredLoginLimiter, issue #15) : paire IP:email
	// stricte, plafond par email (brute-force distribué sur un compte) et
	// plafond par IP (credential stuffing multi-comptes).
	const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
	if (loginLimiter.isLimited(ip, data.email)) {
		throw new Error("Trop de tentatives. Réessayez dans 15 minutes.");
	}

	const row = await loginLookup(data.email);
	// Toujours vérifier un hash (factice si email inconnu ou compte non
	// activé) pour égaliser le temps de réponse — anti-énumération.
	const hashToCheck = row?.password_hash ?? (await DUMMY_PASSWORD_HASH_PROMISE);
	const valid = await verifyPassword(hashToCheck, data.password);

	if (!row || !row.password_hash || !valid) {
		loginLimiter.recordFailure(ip, data.email);
		throw new Error(GENERIC_LOGIN_ERROR);
	}

	loginLimiter.reset(ip, data.email);
	const user: SessionUser = {
		id: row.id,
		name: row.name,
		email: row.email,
		role: row.role,
	};
	await issueSession(user);
	return user;
}

export async function doLogout(): Promise<void> {
	const token = getCookie(REFRESH_COOKIE);
	if (token) {
		// revoked_at antidaté au-delà de la fenêtre de grâce : un logout est une
		// révocation immédiate, jamais une rotation bénigne. Si ce token est
		// quand même représenté ensuite (cookie volé), tryRefresh le traite
		// directement comme un vol (branche ligne ~143) et révoque la famille,
		// au lieu de réémettre silencieusement un access token via la grâce.
		const backdated = new Date(Date.now() - ROTATION_GRACE_MS - 1000).toISOString();
		await db
			.updateTable("refresh_tokens")
			.set({ revoked_at: backdated })
			.where("token_hash", "=", hashRefreshToken(token))
			.where("revoked_at", "is", null)
			.execute();
	}
	clearAuthCookies();
}
