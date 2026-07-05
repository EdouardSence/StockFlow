import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
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
	beforeLoad: async ({ location }) => {
		if (location.pathname === "/login") return {};
		const user = await getSessionFn();
		if (!user) throw redirect({ to: "/login" });
		return { user };
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "StockFlow" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
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
