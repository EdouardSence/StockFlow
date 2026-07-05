import { loadEnv } from "vite";
import { sweepEphemeralData } from "./db";

export default async function globalTeardown() {
	Object.assign(process.env, loadEnv("test", process.cwd(), ""));
	// Best-effort : ne doit jamais faire échouer la suite, mais doit tout tenter.
	try {
		const swept = await sweepEphemeralData();
		console.log("[e2e] sweep post-suite :", swept);
	} catch (err) {
		console.error("[e2e] sweep post-suite en échec — relancer manuellement :", err);
	}
}
