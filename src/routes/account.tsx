import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileBottomNav, useMobile } from "../components/MobileLayout";
import { Sidebar } from "../components/Sidebar";
import { changePasswordFn, logoutFn } from "../lib/auth";

export const Route = createFileRoute("/account")({
	component: AccountPage,
});

const fieldStyle: React.CSSProperties = {
	width: "100%",
	padding: "9px 12px",
	border: "1px solid var(--sf-border)",
	borderRadius: 7,
	fontSize: 13.5,
	background: "var(--sf-bg)",
	color: "var(--sf-fg)",
	fontFamily: "inherit",
	letterSpacing: "-0.005em",
	boxSizing: "border-box",
};

type Phase = "editing" | "submitting" | "done";

function AccountPage() {
	const { user } = Route.useRouteContext();
	const isMobile = useMobile();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [phase, setPhase] = useState<Phase>("editing");
	const [error, setError] = useState<string | null>(null);

	const valid =
		currentPassword.length > 0 &&
		newPassword.length >= 8 &&
		newPassword === confirmPassword;

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!valid) return;
		setPhase("submitting");
		setError(null);
		try {
			await changePasswordFn({ data: { currentPassword, newPassword } });
			setPhase("done");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur inconnue");
			setPhase("editing");
		}
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: isMobile ? "column" : "row",
				height: "100dvh",
				background: "var(--sf-canvas)",
			}}
		>
			{!isMobile && <Sidebar />}
			<main
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					minWidth: 0,
					overflow: "auto",
				}}
			>
				<header
					style={{
						padding: "14px 28px",
						borderBottom: "1px solid var(--sf-border)",
						background: "var(--sf-bg)",
					}}
				>
					<span
						style={{ fontSize: 13, color: "var(--sf-fg)", fontWeight: 500 }}
					>
						Paramètres
					</span>
				</header>
				<div style={{ padding: isMobile ? 16 : 28, maxWidth: 480 }}>
					<h1
						style={{
							fontSize: 20,
							fontWeight: 600,
							margin: "0 0 4px",
							color: "var(--sf-fg)",
						}}
					>
						Changer le mot de passe
					</h1>
					<p
						style={{
							fontSize: 13,
							color: "var(--sf-fg-muted)",
							margin: "0 0 20px",
						}}
					>
						{user?.email}
					</p>

					<form
						onSubmit={handleSubmit}
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 16,
							background: "var(--sf-bg)",
							border: "1px solid var(--sf-border)",
							borderRadius: 10,
							padding: 20,
						}}
					>
						<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
							<label
								htmlFor="current-password"
								style={{
									fontSize: 12.5,
									fontWeight: 500,
									color: "var(--sf-fg)",
								}}
							>
								Mot de passe actuel
							</label>
							<input
								id="current-password"
								type="password"
								autoComplete="current-password"
								style={fieldStyle}
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
							/>
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
							<label
								htmlFor="new-password"
								style={{
									fontSize: 12.5,
									fontWeight: 500,
									color: "var(--sf-fg)",
								}}
							>
								Nouveau mot de passe
							</label>
							<input
								id="new-password"
								type="password"
								autoComplete="new-password"
								style={fieldStyle}
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
							/>
							<span style={{ fontSize: 11.5, color: "var(--sf-fg-muted)" }}>
								8 caractères minimum
							</span>
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
							<label
								htmlFor="confirm-password"
								style={{
									fontSize: 12.5,
									fontWeight: 500,
									color: "var(--sf-fg)",
								}}
							>
								Confirmer le nouveau mot de passe
							</label>
							<input
								id="confirm-password"
								type="password"
								autoComplete="new-password"
								style={fieldStyle}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
							/>
							{confirmPassword.length > 0 &&
								confirmPassword !== newPassword && (
									<span style={{ fontSize: 11.5, color: "var(--sf-danger)" }}>
										Les mots de passe ne correspondent pas.
									</span>
								)}
						</div>

						{error && (
							<p style={{ fontSize: 13, color: "var(--sf-danger)", margin: 0 }}>
								{error}
							</p>
						)}
						{phase === "done" && (
							<p
								style={{ fontSize: 13, color: "var(--sf-success)", margin: 0 }}
							>
								Mot de passe mis à jour.
							</p>
						)}

						<button
							type="submit"
							disabled={!valid || phase === "submitting"}
							style={{
								padding: "8px 16px",
								border: "1px solid var(--sf-primary-strong)",
								background:
									"linear-gradient(135deg, var(--sf-primary), var(--sf-primary-strong))",
								color: "white",
								borderRadius: 7,
								fontSize: 13,
								fontWeight: 500,
								cursor: valid ? "pointer" : "not-allowed",
								fontFamily: "inherit",
								opacity: valid ? 1 : 0.5,
								alignSelf: "flex-start",
							}}
						>
							{phase === "submitting" ? "Mise à jour…" : "Mettre à jour"}
						</button>
					</form>

					{/* Sur mobile la sidebar (et son bouton de déconnexion) n'existe pas. */}
					{isMobile && (
						<button
							type="button"
							onClick={async () => {
								await logoutFn();
								window.localStorage.removeItem("sf-offline-user");
								window.location.href = "/login";
							}}
							style={{
								marginTop: 16,
								width: "100%",
								padding: "11px 16px",
								border: "1px solid var(--sf-border)",
								background: "var(--sf-bg)",
								color: "var(--sf-danger)",
								borderRadius: 9,
								fontSize: 13.5,
								fontWeight: 500,
								cursor: "pointer",
								fontFamily: "inherit",
							}}
						>
							Se déconnecter
						</button>
					)}
				</div>
			</main>
			{isMobile && <MobileBottomNav active="profile" />}
		</div>
	);
}
