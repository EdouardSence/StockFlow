import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { loginFn } from "../lib/auth";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

const fieldStyle: React.CSSProperties = {
	width: "100%",
	padding: "10px 12px",
	border: "1px solid var(--sf-border)",
	borderRadius: 7,
	fontSize: 14,
	background: "var(--sf-bg)",
	color: "var(--sf-fg)",
	fontFamily: "inherit",
	outline: "none",
	boxSizing: "border-box",
};

function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			await loginFn({ data: { email, password } });
			await navigate({ to: "/" });
		} catch (err) {
			setError(
				err instanceof Error && err.message.length < 120
					? err.message
					: "Connexion impossible. Réessayez.",
			);
			setSubmitting(false);
		}
	}

	return (
		<main
			style={{
				minHeight: "100vh",
				background: "var(--sf-canvas)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 16,
				fontFamily: "var(--sf-sans)",
			}}
		>
			<form
				onSubmit={handleSubmit}
				style={{
					width: "100%",
					maxWidth: 360,
					background: "var(--sf-bg)",
					border: "1px solid var(--sf-border)",
					borderRadius: 12,
					padding: "28px 26px",
					display: "flex",
					flexDirection: "column",
					gap: 16,
				}}
			>
				<div>
					<h1
						style={{
							fontSize: 20,
							fontWeight: 600,
							letterSpacing: "-0.015em",
							margin: 0,
							color: "var(--sf-fg)",
						}}
					>
						StockFlow
					</h1>
					<p
						style={{
							fontSize: 13,
							color: "var(--sf-fg-muted)",
							margin: "4px 0 0",
						}}
					>
						Connectez-vous pour accéder au parc.
					</p>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
					<label
						htmlFor="login-email"
						style={{ fontSize: 12.5, fontWeight: 500, color: "var(--sf-fg)" }}
					>
						Email
					</label>
					<input
						id="login-email"
						type="email"
						autoComplete="username"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						style={fieldStyle}
					/>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
					<label
						htmlFor="login-password"
						style={{ fontSize: 12.5, fontWeight: 500, color: "var(--sf-fg)" }}
					>
						Mot de passe
					</label>
					<input
						id="login-password"
						type="password"
						autoComplete="current-password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						style={fieldStyle}
					/>
				</div>

				{error && (
					<p
						role="alert"
						style={{ fontSize: 13, color: "oklch(0.50 0.18 25)", margin: 0 }}
					>
						{error}
					</p>
				)}

				<button
					type="submit"
					disabled={submitting}
					style={{
						padding: "10px 16px",
						border: "1px solid oklch(0.45 0.14 255)",
						background: "oklch(0.55 0.16 255)",
						color: "white",
						borderRadius: 7,
						fontSize: 14,
						fontWeight: 500,
						cursor: submitting ? "wait" : "pointer",
						fontFamily: "inherit",
					}}
				>
					{submitting ? "Connexion…" : "Se connecter"}
				</button>
			</form>
		</main>
	);
}
