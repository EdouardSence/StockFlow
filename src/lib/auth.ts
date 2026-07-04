// Déclarations des server functions et middlewares d'auth. Ce module est
// atteignable par le bundle client : AUCUN import serveur statique ici — la
// logique vit dans auth-server.ts, importé dynamiquement dans les callbacks
// serveur (éliminés du client par le splitter TanStack Start).
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SessionUser } from "./auth-core";

/* ── Middlewares ────────────────────────────────────────────────── */

export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const [{ resolveSession }, { AuthError }] = await Promise.all([
			import("./auth-server"),
			import("./auth-core"),
		]);
		const user = await resolveSession();
		if (!user) throw new AuthError("UNAUTHORIZED");
		return next({ context: { user } });
	},
);

export const adminMiddleware = createMiddleware({ type: "function" })
	.middleware([authMiddleware])
	.server(async ({ next, context }) => {
		const { assertRole } = await import("./auth-core");
		assertRole(context.user, "admin");
		return next();
	});

/* ── Server functions ───────────────────────────────────────────── */

const loginSchema = z.object({
	email: z.string().trim().toLowerCase().email().max(254),
	password: z.string().min(1).max(1024),
});

export const loginFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => loginSchema.parse(data))
	.handler(async ({ data }): Promise<SessionUser> => {
		const { doLogin } = await import("./auth-server");
		return doLogin(data);
	});

export const logoutFn = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ success: true }> => {
		const { doLogout } = await import("./auth-server");
		await doLogout();
		return { success: true };
	},
);

export const getSessionFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<SessionUser | null> => {
		const { resolveSession } = await import("./auth-server");
		return resolveSession();
	},
);
