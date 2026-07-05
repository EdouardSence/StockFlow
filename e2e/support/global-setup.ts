import { loadEnv } from "vite";
import { hashPassword } from "../../src/lib/auth-core";
import { createEphemeralAdmin, E2E_ADMIN, sweepEphemeralData } from "./db";

export default async function globalSetup() {
	// Charge .env.local (APP_POSTGRES_URL) comme le fait vitest.config.ts.
	Object.assign(process.env, loadEnv("test", process.cwd(), ""));

	// Nettoie d'abord les restes d'un run précédent interrompu.
	const swept = await sweepEphemeralData();
	console.log("[e2e] sweep pré-suite :", swept);

	await createEphemeralAdmin(await hashPassword(E2E_ADMIN.password));
	console.log(`[e2e] compte admin éphémère prêt : ${E2E_ADMIN.email}`);
}
