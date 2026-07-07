import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { createUserFn, deactivateUserFn, listUsersFn } from "../../lib/users";

export const Route = createFileRoute("/admin/users")({
	beforeLoad: ({ context }) => {
		if (context.user?.role !== "admin") throw redirect({ to: "/" });
	},
	loader: () => listUsersFn(),
	component: AdminUsersPage,
});

const fieldStyle: React.CSSProperties = {
	width: "100%",
	padding: "8px 10px",
	border: "1px solid var(--sf-border)",
	borderRadius: 7,
	fontSize: 13,
	background: "var(--sf-bg)",
	color: "var(--sf-fg)",
	fontFamily: "inherit",
	boxSizing: "border-box",
};

function AdminUsersPage() {
	const users = Route.useLoaderData();
	const { user: currentUser } = Route.useRouteContext();
	const router = useRouter();

	const [form, setForm] = useState({
		name: "",
		email: "",
		role: "technician" as "admin" | "technician",
		password: "",
	});
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pendingId, setPendingId] = useState<string | null>(null);

	const valid =
		form.name.trim().length > 0 &&
		form.email.trim().length > 0 &&
		form.password.length >= 8;

	async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!valid) return;
		setCreating(true);
		setError(null);
		try {
			await createUserFn({ data: form });
			setForm({ name: "", email: "", role: "technician", password: "" });
			await router.invalidate();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur inconnue");
		} finally {
			setCreating(false);
		}
	}

	async function handleDeactivate(id: string) {
		setPendingId(id);
		setError(null);
		try {
			await deactivateUserFn({ data: { id } });
			await router.invalidate();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur inconnue");
		} finally {
			setPendingId(null);
		}
	}

	return (
		<div
			style={{
				display: "flex",
				height: "100vh",
				background: "var(--sf-canvas)",
			}}
		>
			<Sidebar />
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
						Utilisateurs
					</span>
				</header>

				<div
					style={{
						padding: 28,
						display: "flex",
						flexDirection: "column",
						gap: 24,
						maxWidth: 900,
					}}
				>
					<section
						style={{
							border: "1px solid var(--sf-border)",
							borderRadius: 10,
							background: "var(--sf-bg)",
							overflow: "hidden",
						}}
					>
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
								fontSize: 13,
							}}
						>
							<thead>
								<tr style={{ background: "var(--sf-surface)" }}>
									<th style={thStyle}>Nom</th>
									<th style={thStyle}>Email</th>
									<th style={thStyle}>Rôle</th>
									<th style={thStyle}>Statut</th>
									<th style={thStyle}>
										<span
											style={{
												position: "absolute",
												width: 1,
												height: 1,
												padding: 0,
												margin: -1,
												overflow: "hidden",
												clip: "rect(0, 0, 0, 0)",
												whiteSpace: "nowrap",
												border: 0,
											}}
										>
											Actions
										</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{users.map((u) => (
									<tr
										key={u.id}
										style={{ borderTop: "1px solid var(--sf-border)" }}
									>
										<td style={tdStyle}>{u.name}</td>
										<td style={tdStyle}>{u.email}</td>
										<td style={tdStyle}>
											{u.role === "admin" ? "Administrateur" : "Technicien"}
										</td>
										<td style={tdStyle}>
											<span
												style={{
													fontSize: 11.5,
													padding: "2px 8px",
													borderRadius: 999,
													color: u.active
														? "var(--sf-success)"
														: "var(--sf-fg-muted)",
													background: u.active
														? "var(--sf-success-tint)"
														: "var(--sf-surface-2)",
												}}
											>
												{u.active ? "Actif" : "Désactivé"}
											</span>
										</td>
										<td style={{ ...tdStyle, textAlign: "right" }}>
											{u.active && u.id !== currentUser?.id && (
												<button
													type="button"
													onClick={() => handleDeactivate(u.id)}
													disabled={pendingId === u.id}
													style={{
														padding: "5px 10px",
														border: "1px solid var(--sf-border)",
														background: "var(--sf-bg)",
														borderRadius: 6,
														fontSize: 12,
														color: "var(--sf-danger)",
														cursor: "pointer",
														fontFamily: "inherit",
													}}
												>
													{pendingId === u.id ? "…" : "Désactiver"}
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</section>

					<section
						style={{
							border: "1px solid var(--sf-border)",
							borderRadius: 10,
							background: "var(--sf-bg)",
							padding: 20,
							maxWidth: 420,
						}}
					>
						<h2
							style={{
								fontSize: 15,
								fontWeight: 600,
								margin: "0 0 14px",
								color: "var(--sf-fg)",
							}}
						>
							Nouvel utilisateur
						</h2>
						<form
							onSubmit={handleCreate}
							style={{ display: "flex", flexDirection: "column", gap: 12 }}
						>
							<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
								<label
									htmlFor="new-user-name"
									style={{ fontSize: 12, color: "var(--sf-fg)" }}
								>
									Nom
								</label>
								<input
									id="new-user-name"
									style={fieldStyle}
									value={form.name}
									onChange={(e) =>
										setForm((f) => ({ ...f, name: e.target.value }))
									}
								/>
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
								<label
									htmlFor="new-user-email"
									style={{ fontSize: 12, color: "var(--sf-fg)" }}
								>
									Email
								</label>
								<input
									id="new-user-email"
									type="email"
									style={fieldStyle}
									value={form.email}
									onChange={(e) =>
										setForm((f) => ({ ...f, email: e.target.value }))
									}
								/>
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
								<label
									htmlFor="new-user-role"
									style={{ fontSize: 12, color: "var(--sf-fg)" }}
								>
									Rôle
								</label>
								<select
									id="new-user-role"
									style={fieldStyle}
									value={form.role}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											role: e.target.value as "admin" | "technician",
										}))
									}
								>
									<option value="technician">Technicien</option>
									<option value="admin">Administrateur</option>
								</select>
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
								<label
									htmlFor="new-user-password"
									style={{ fontSize: 12, color: "var(--sf-fg)" }}
								>
									Mot de passe initial
								</label>
								<input
									id="new-user-password"
									type="password"
									autoComplete="new-password"
									style={fieldStyle}
									value={form.password}
									onChange={(e) =>
										setForm((f) => ({ ...f, password: e.target.value }))
									}
								/>
								<span style={{ fontSize: 11, color: "var(--sf-fg-muted)" }}>
									8 caractères minimum
								</span>
							</div>

							{error && (
								<p
									style={{
										fontSize: 12.5,
										color: "var(--sf-danger)",
										margin: 0,
									}}
								>
									{error}
								</p>
							)}

							<button
								type="submit"
								disabled={!valid || creating}
								style={{
									padding: "8px 14px",
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
								{creating ? "Création…" : "Créer le compte"}
							</button>
						</form>
					</section>
				</div>
			</main>
		</div>
	);
}

const thStyle: React.CSSProperties = {
	textAlign: "left",
	padding: "10px 14px",
	fontSize: 11,
	fontWeight: 600,
	textTransform: "uppercase",
	letterSpacing: "0.04em",
	color: "var(--sf-fg-muted)",
};

const tdStyle: React.CSSProperties = {
	padding: "10px 14px",
	color: "var(--sf-fg)",
};
