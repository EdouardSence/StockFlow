import * as Sentry from "@sentry/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { StatusBadge } from "../../components/StatusBadge";
import type { EquipmentTable } from "../../db/types";
import { getEquipments } from "../../lib/equipment";

export const Route = createFileRoute("/equipment/")({
	loader: () => getEquipments(),
	component: EquipmentList,
});

const TYPE_LABELS: Record<EquipmentTable["type"], string> = {
	pc: "Fixe",
	laptop: "Portable",
	screen: "Écran",
	printer: "Imprimante",
	phone: "Téléphone",
	other: "Autre",
};

const thStyle: React.CSSProperties = {
	textAlign: "left",
	fontSize: 11,
	fontWeight: 500,
	color: "var(--sf-fg-muted)",
	textTransform: "uppercase",
	letterSpacing: "0.06em",
	padding: "10px 14px",
	borderBottom: "1px solid var(--sf-border)",
	whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
	padding: "12px 14px",
	borderBottom: "1px solid var(--sf-border-soft)",
	verticalAlign: "middle",
	whiteSpace: "nowrap",
};

const pagBtn: React.CSSProperties = {
	padding: "4px 9px",
	border: "1px solid var(--sf-border)",
	borderRadius: 5,
	background: "transparent",
	fontSize: 12,
	color: "var(--sf-fg-muted)",
	cursor: "pointer",
	fontFamily: "inherit",
};

type FilterId = "all" | EquipmentTable["status"];

function EquipmentList() {
	const equipment = Route.useLoaderData();
	const [filter, setFilter] = useState<FilterId>("all");
	const [query, setQuery] = useState("");

	const counts = useMemo(() => {
		const c = {
			total: equipment.length,
			available: 0,
			assigned: 0,
			broken: 0,
			maintenance: 0,
		};
		for (const e of equipment) {
			if (e.status in c) (c as Record<string, number>)[e.status]++;
		}
		return c;
	}, [equipment]);

	const filtered = useMemo(() => {
		return equipment.filter((e) => {
			if (filter !== "all" && e.status !== filter) return false;
			if (!query) return true;
			const q = query.toLowerCase();
			return (
				e.name.toLowerCase().includes(q) ||
				(e.serial_number ?? "").toLowerCase().includes(q) ||
				(e.assigned_to ?? "").toLowerCase().includes(q)
			);
		});
	}, [equipment, filter, query]);

	const filterTabs: { id: FilterId; label: string; count: number }[] = [
		{ id: "all", label: "Tout", count: counts.total },
		{ id: "available", label: "Disponible", count: counts.available },
		{ id: "assigned", label: "Assigné", count: counts.assigned },
		{ id: "broken", label: "En panne", count: counts.broken },
		{ id: "maintenance", label: "Maintenance", count: counts.maintenance },
	];

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
					overflow: "hidden",
				}}
			>
				{/* Top bar */}
				<header
					style={{
						display: "flex",
						alignItems: "center",
						padding: "16px 28px",
						borderBottom: "1px solid var(--sf-border)",
						gap: 12,
						background: "var(--sf-bg)",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
							fontSize: 13,
							color: "var(--sf-fg-muted)",
						}}
					>
						<span>Pilotage</span>
						<svg
							width={12}
							height={12}
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--sf-fg-muted)"
							strokeWidth={1.6}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="9 18 15 12 9 6" />
						</svg>
						<span style={{ color: "var(--sf-fg)", fontWeight: 500 }}>
							Équipements
						</span>
					</div>
					<div style={{ flex: 1 }} />
					<button
						type="button"
						onClick={() => {
							const err = new Error(
								"StockFlow: impression étiquettes non implémentée",
							);
							Sentry.captureException(err);
							alert("Erreur envoyée à Sentry ✓");
						}}
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
							padding: "7px 12px",
							border: "1px solid var(--sf-border)",
							background: "var(--sf-bg)",
							borderRadius: 7,
							fontSize: 13,
							color: "var(--sf-fg-soft)",
							cursor: "pointer",
							fontFamily: "inherit",
						}}
					>
						<svg
							width={14}
							height={14}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.6}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<rect x="3" y="3" width="7" height="7" />
							<rect x="14" y="3" width="7" height="7" />
							<rect x="14" y="14" width="7" height="7" />
							<rect x="3" y="14" width="7" height="7" />
						</svg>
						Imprimer étiquettes
					</button>
					<Link
						to="/equipment/new"
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
							padding: "7px 13px",
							border: "1px solid oklch(0.45 0.14 255)",
							background: "oklch(0.55 0.16 255)",
							color: "white",
							borderRadius: 7,
							fontSize: 13,
							fontWeight: 500,
							cursor: "pointer",
							fontFamily: "inherit",
							textDecoration: "none",
							boxShadow:
								"0 1px 0 0 oklch(0.40 0.14 255 / 0.30) inset, 0 1px 2px oklch(0.55 0.16 255 / 0.25)",
						}}
					>
						<svg
							width={14}
							height={14}
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						Ajouter un équipement
					</Link>
				</header>

				{/* Page header */}
				<div style={{ padding: "26px 28px 18px" }}>
					<div
						style={{
							display: "flex",
							alignItems: "flex-end",
							justifyContent: "space-between",
							gap: 24,
						}}
					>
						<div>
							<h1
								style={{
									fontSize: 22,
									fontWeight: 600,
									letterSpacing: "-0.02em",
									color: "var(--sf-fg)",
									margin: 0,
								}}
							>
								Parc informatique
							</h1>
							<p
								style={{
									fontSize: 13.5,
									color: "var(--sf-fg-muted)",
									margin: "4px 0 0",
									letterSpacing: "-0.005em",
								}}
							>
								{equipment.length} équipement{equipment.length !== 1 ? "s" : ""}{" "}
								enregistrés
							</p>
						</div>
						<div
							style={{
								fontSize: 11.5,
								color: "var(--sf-fg-muted)",
								fontFamily: "var(--sf-mono)",
							}}
						>
							{new Date().toLocaleDateString("fr-FR", {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</div>
					</div>

					{/* Stat cards */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(4, 1fr)",
							gap: 12,
							marginTop: 22,
						}}
					>
						{[
							{
								label: "Total équipements",
								value: counts.total,
								dot: undefined,
							},
							{
								label: "Disponibles",
								value: counts.available,
								dot: "oklch(0.68 0.15 152)",
							},
							{
								label: "Assignés",
								value: counts.assigned,
								dot: "oklch(0.58 0.16 255)",
							},
							{
								label: "En panne",
								value: counts.broken,
								dot: "oklch(0.62 0.20 25)",
							},
						].map((card) => (
							<div
								key={card.label}
								style={{
									background: "var(--sf-bg)",
									border: "1px solid var(--sf-border)",
									borderRadius: 10,
									padding: "16px 18px",
									display: "flex",
									flexDirection: "column",
									gap: 10,
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									{card.dot && (
										<span
											style={{
												width: 6,
												height: 6,
												borderRadius: "50%",
												background: card.dot,
												flex: "none",
											}}
										/>
									)}
									<span
										style={{
											fontSize: 12,
											color: "var(--sf-fg-muted)",
											letterSpacing: "-0.005em",
											fontWeight: 500,
										}}
									>
										{card.label}
									</span>
								</div>
								<span
									style={{
										fontSize: 28,
										fontWeight: 600,
										letterSpacing: "-0.02em",
										color: "var(--sf-fg)",
										fontVariantNumeric: "tabular-nums",
										lineHeight: 1,
									}}
								>
									{card.value}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Table card */}
				<div
					style={{
						padding: "0 28px 28px",
						flex: 1,
						minHeight: 0,
						display: "flex",
						flexDirection: "column",
					}}
				>
					<div
						style={{
							border: "1px solid var(--sf-border)",
							borderRadius: 10,
							background: "var(--sf-bg)",
							overflow: "hidden",
							display: "flex",
							flexDirection: "column",
							flex: 1,
							minHeight: 0,
						}}
					>
						{/* Toolbar */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 8,
								padding: "10px 14px",
								borderBottom: "1px solid var(--sf-border)",
							}}
						>
							<div
								style={{
									display: "inline-flex",
									gap: 2,
									padding: 2,
									background: "var(--sf-surface)",
									borderRadius: 7,
									border: "1px solid var(--sf-border)",
								}}
							>
								{filterTabs.map((t) => (
									<button
										key={t.id}
										type="button"
										onClick={() => setFilter(t.id)}
										style={{
											display: "inline-flex",
											alignItems: "center",
											gap: 6,
											padding: "5px 10px",
											border: "none",
											background:
												filter === t.id ? "var(--sf-bg)" : "transparent",
											borderRadius: 5,
											fontSize: 12.5,
											fontWeight: 500,
											color:
												filter === t.id ? "var(--sf-fg)" : "var(--sf-fg-muted)",
											cursor: "pointer",
											fontFamily: "inherit",
											boxShadow:
												filter === t.id
													? "0 1px 2px oklch(0 0 0 / 0.06), 0 0 0 1px var(--sf-border)"
													: "none",
										}}
									>
										{t.label}
										<span
											style={{
												fontSize: 11,
												color: "var(--sf-fg-muted)",
												fontVariantNumeric: "tabular-nums",
											}}
										>
											{t.count}
										</span>
									</button>
								))}
							</div>

							<div style={{ flex: 1 }} />

							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 6,
									padding: "5px 10px",
									border: "1px solid var(--sf-border)",
									borderRadius: 6,
									background: "var(--sf-bg)",
									width: 220,
								}}
							>
								<svg
									width={13}
									height={13}
									viewBox="0 0 24 24"
									fill="none"
									stroke="var(--sf-fg-muted)"
									strokeWidth={1.8}
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<circle cx="11" cy="11" r="8" />
									<line x1="21" y1="21" x2="16.65" y2="16.65" />
								</svg>
								<input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Nom, n° série, utilisateur"
									style={{
										border: "none",
										background: "transparent",
										outline: "none",
										fontSize: 12.5,
										color: "var(--sf-fg)",
										fontFamily: "inherit",
										flex: 1,
										minWidth: 0,
									}}
								/>
							</div>
						</div>

						{/* Table */}
						<div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
							{filtered.length === 0 ? (
								<div
									style={{
										padding: "48px 28px",
										textAlign: "center",
										color: "var(--sf-fg-muted)",
										fontSize: 13.5,
									}}
								>
									Aucun équipement trouvé.
								</div>
							) : (
								<table
									style={{
										width: "100%",
										borderCollapse: "separate",
										borderSpacing: 0,
										fontSize: 13,
									}}
								>
									<thead>
										<tr
											style={{
												position: "sticky",
												top: 0,
												background: "var(--sf-surface)",
												zIndex: 1,
											}}
										>
											<th style={thStyle}>Nom / ID</th>
											<th style={thStyle}>Type</th>
											<th style={thStyle}>N° série</th>
											<th style={thStyle}>Statut</th>
											<th style={thStyle}>QR Code</th>
											<th style={thStyle}>Ajouté le</th>
										</tr>
									</thead>
									<tbody>
										{filtered.map((e, i) => (
											<tr
												key={e.id}
												style={{
													background:
														i % 2 === 1
															? "oklch(0.99 0.005 255)"
															: "var(--sf-bg)",
												}}
												onMouseEnter={(ev) => {
													ev.currentTarget.style.background =
														"var(--sf-surface)";
												}}
												onMouseLeave={(ev) => {
													ev.currentTarget.style.background =
														i % 2 === 1
															? "oklch(0.99 0.005 255)"
															: "var(--sf-bg)";
												}}
											>
												<td style={tdStyle}>
													<div
														style={{
															display: "flex",
															flexDirection: "column",
															gap: 2,
														}}
													>
														<span
															style={{
																fontWeight: 500,
																color: "var(--sf-fg)",
																letterSpacing: "-0.005em",
															}}
														>
															{e.name}
														</span>
														<span
															style={{
																fontSize: 11.5,
																color: "var(--sf-fg-muted)",
																fontFamily: "var(--sf-mono)",
															}}
														>
															{e.id.slice(0, 8)}
														</span>
													</div>
												</td>
												<td style={{ ...tdStyle, color: "var(--sf-fg-soft)" }}>
													{TYPE_LABELS[e.type] ?? e.type}
												</td>
												<td
													style={{
														...tdStyle,
														fontFamily: "var(--sf-mono)",
														fontSize: 12,
														color: "var(--sf-fg-soft)",
													}}
												>
													{e.serial_number ?? "—"}
												</td>
												<td style={tdStyle}>
													<StatusBadge status={e.status} />
												</td>
												<td
													style={{
														...tdStyle,
														fontFamily: "var(--sf-mono)",
														fontSize: 11.5,
														color: "var(--sf-fg-muted)",
													}}
												>
													{e.qr_code.slice(0, 8)}…
												</td>
												<td style={{ ...tdStyle, color: "var(--sf-fg-soft)" }}>
													{new Date(e.created_at).toLocaleDateString("fr-FR")}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>

						{/* Footer */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								padding: "10px 14px",
								borderTop: "1px solid var(--sf-border)",
								fontSize: 12,
								color: "var(--sf-fg-muted)",
								background: "var(--sf-surface)",
							}}
						>
							<span>
								<span style={{ color: "var(--sf-fg)", fontWeight: 500 }}>
									{filtered.length}
								</span>{" "}
								sur {equipment.length} équipements
							</span>
							<div style={{ display: "flex", gap: 4 }}>
								<button type="button" style={pagBtn}>
									Précédent
								</button>
								<button
									type="button"
									style={{
										...pagBtn,
										background: "var(--sf-bg)",
										color: "var(--sf-fg)",
										fontWeight: 500,
									}}
								>
									1
								</button>
								<button type="button" style={pagBtn}>
									Suivant
								</button>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
