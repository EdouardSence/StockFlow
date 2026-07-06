import { loadEnv } from "vite";
import { hashPassword } from "../../src/lib/auth-core";
import { createEphemeralUser, E2E_ADMIN, E2E_TECH, sweepEphemeralData } from "./db";

export default async function globalSetup() {
	// Charge .env.local (APP_POSTGRES_URL) comme le fait vitest.config.ts.
	Object.assign(process.env, loadEnv("test", process.cwd(), ""));

	// Nettoie d'abord les restes d'un run précédent interrompu.
	const swept = await sweepEphemeralData();
	console.log("[e2e] sweep pré-suite :", swept);

	const hash = await hashPassword(E2E_ADMIN.password);
	await createEphemeralUser(E2E_ADMIN, hash);
	await createEphemeralUser(E2E_TECH, hash);
	console.log(`[e2e] comptes éphémères prêts : ${E2E_ADMIN.email}, ${E2E_TECH.email}`);
}
