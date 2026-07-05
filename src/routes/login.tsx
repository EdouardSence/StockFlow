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
			<div
				style={{
					width: "100%",
					maxWidth: 360,
					display: "flex",
					flexDirection: "column",
					gap: 20,
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 12,
					}}
				>
					<div
						style={{
							width: 48,
							height: 48,
							borderRadius: 14,
							background:
								"linear-gradient(135deg, var(--sf-primary), #4338ca)",
							boxShadow:
								"0 0 0 1px rgba(99,102,241,.4), 0 8px 24px rgba(99,102,241,.3)",
						}}
					/>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 2,
						}}
					>
						<h1
							style={{
								fontSize: 19,
								fontWeight: 700,
								letterSpacing: "-0.02em",
								margin: 0,
								color: "var(--sf-fg)",
							}}
						>
							StockFlow
						</h1>
						<p
							style={{
								fontSize: 13,
								color: "var(--sf-fg-faint)",
								margin: 0,
							}}
						>
							Connectez-vous pour accéder au parc.
						</p>
					</div>
				</div>

				<form
					onSubmit={handleSubmit}
					style={{
						background: "var(--sf-bg)",
						border: "1px solid var(--sf-border)",
						borderRadius: 18,
						padding: "22px",
						display: "flex",
						flexDirection: "column",
						gap: 16,
					}}
				>

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
						style={{ fontSize: 13, color: "var(--sf-danger)", margin: 0 }}
					>
						{error}
					</p>
				)}

				<button
					type="submit"
					disabled={submitting}
					style={{
						padding: "10px 16px",
						border: "1px solid var(--sf-primary-strong)",
						background:
							"linear-gradient(135deg, var(--sf-primary), var(--sf-primary-strong))",
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
			</div>
		</main>
	);
}
