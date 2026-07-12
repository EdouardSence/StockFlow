import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { getSessionFn } from "../lib/auth";
import appCss from "../styles.css?url";

if (typeof window !== "undefined") {
	import("@sentry/react").then((Sentry) => {
		Sentry.init({
			dsn: "https://a5aa84c6101cec76642281e1df17f325@o4511350832824320.ingest.de.sentry.io/4511350837149776",
			// RGPD/minimisation : ne pas envoyer IP + PII par défaut à Sentry (tiers).
			sendDefaultPii: false,
		});
	});
}

export const Route = createRootRoute({
	// Garde UX : redirige vers /login sans session. La vraie barrière de
	// sécurité reste côté serveur (authMiddleware sur les server functions).
	// Hors-ligne, getSessionFn échoue en erreur réseau : on retombe sur la
	// dernière identité connue (champs non sensibles) pour servir le shell —
	// les données affichées viennent du cache SW déjà autorisé, et toute
	// mutation repassera par le serveur (401 possible au flush).
	beforeLoad: async ({ location }) => {
		if (location.pathname === "/login") return {};
		let user: Awaited<ReturnType<typeof getSessionFn>>;
		try {
			user = await getSessionFn();
		} catch {
			if (typeof window !== "undefined") {
				const cached = window.localStorage.getItem("sf-offline-user");
				if (cached) return { user: JSON.parse(cached) };
			}
			throw redirect({ to: "/login" });
		}
		if (!user) throw redirect({ to: "/login" });
		if (typeof window !== "undefined") {
			window.localStorage.setItem("sf-offline-user", JSON.stringify(user));
		}
		return { user };
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "theme-color", content: "#0f172a" },
			{ title: "StockFlow" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/manifest.webmanifest" },
			{ rel: "apple-touch-icon", href: "/icon-192.png" },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	// Enregistrement du service worker (prod uniquement : pas de SW généré en dev).
	useEffect(() => {
		if (import.meta.env.PROD && "serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js");
		}
	}, []);

	return (
		<html lang="fr" style={{ height: "100%" }}>
			<head>
				<HeadContent />
			</head>
			<body style={{ margin: 0, height: "100%" }}>
				{children}
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
