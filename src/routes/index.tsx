import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileBottomNav, StockFlowLogo, TypeIcon } from "../components/MobileLayout";
import { Sidebar } from "../components/Sidebar";
import { OpenIncidentBadge, StatusBadge } from "../components/StatusBadge";
import type { EquipmentTable } from "../db/types";
import {
	assignEquipmentFn,
	getAssignableUsersFn,
	getEquipments,
} from "../lib/equipment";
import {
	getOpenIncidentCountsFn,
	listOpenIncidentsFn,
} from "../lib/incidents";

export const Route = createFileRoute("/")({
	loader: async ({ context }) => {
		const [equipment, incidentCounts, openIncidents, assignableUsers] =
			await Promise.all([
				getEquipments(),
				getOpenIncidentCountsFn(),
				listOpenIncidentsFn(),
				context.user?.role === "admin"
					? getAssignableUsersFn()
					: Promise.resolve([]),
			]);
		return { equipment, incidentCounts, openIncidents, assignableUsers };
	},
	component: IndexPage,
});

function useMobile() {
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" ? window.innerWidth < 768 : false,
	);
	useEffect(() => {
		if (typeof window === "undefined") return;
		const mq = window.matchMedia("(max-width: 767px)");
		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mq.addEventListener("change", handler);
		setIsMobile(mq.matches);
		return () => mq.removeEventListener("change", handler);
	}, []);
	return isMobile;
}

function IndexPage() {
	const isMobile = useMobile();
	const { equipment } = Route.useLoaderData();

	if (!isMobile) {
		return <DesktopDashboard />;
	}

	return <MobileHome equipment={equipment} />;
}

/* ── Dashboard desktop (design StockFlow v1 — « Vue d'ensemble du parc ») ── */

const KPI_ICONS = {
	total: (
		<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
		</svg>
	),
	available: (
		<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="10" /><polyline points="8 12 11 15 16 9" />
		</svg>
	),
	broken: (
		<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
			<line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
	),
	maintenance: (
		<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
		</svg>
	),
};

const TYPE_LABELS: Record<EquipmentTable["type"], string> = {
	pc: "Portable",
	screen: "Écran",
	printer: "Imprimante",
	other: "Autre",
};

const dashThStyle: React.CSSProperties = {
	textAlign: "left",
	fontSize: 10.5,
	fontWeight: 600,
	color: "var(--sf-fg-muted)",
	textTransform: "uppercase",
	letterSpacing: "0.07em",
	padding: "10px 14px",
	borderBottom: "1px solid var(--sf-border)",
	whiteSpace: "nowrap",
};

const dashTdStyle: React.CSSProperties = {
	padding: "12px 14px",
	borderBottom: "1px solid var(--sf-border-soft)",
	verticalAlign: "middle",
	whiteSpace: "nowrap",
};

function DesktopDashboard() {
	const { equipment, incidentCounts, openIncidents, assignableUsers } =
		Route.useLoaderData();
	const { user: currentUser } = Route.useRouteContext();
	const router = useRouter();
	const [releasingId, setReleasingId] = useState<string | null>(null);

	const counts = {
		total: equipment.length,
		available: 0,
		assigned: 0,
		broken: 0,
		maintenance: 0,
	};
	for (const e of equipment) {
		if (e.status in counts) (counts as Record<string, number>)[e.status]++;
	}
	const openIncidentTotal = incidentCounts.reduce((s, c) => s + c.count, 0);
	const incidentCountById = new Map(
		incidentCounts.map((c) => [c.equipment_id, c.count]),
	);
	const userNameById = new Map(assignableUsers.map((u) => [u.id, u.name]));
	const recent = [...equipment]
		.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
		.slice(0, 8);

	function assignedLabel(e: EquipmentTable): string {
		if (e.assigned_to === null) return "—";
		if (e.assigned_to === currentUser?.id) return "Vous";
		return userNameById.get(e.assigned_to) ?? "Un autre utilisateur";
	}

	async function release(id: string) {
		setReleasingId(id);
		try {
			await assignEquipmentFn({ data: { id, userId: null } });
			await router.invalidate();
		} finally {
			setReleasingId(null);
		}
	}

	const kpis = [
		{
			key: "total",
			label: "Total équipements",
			value: counts.total,
			icon: KPI_ICONS.total,
			color: "var(--sf-primary-soft)",
			sub: undefined as string | undefined,
			subColor: undefined as string | undefined,
		},
		{
			key: "available",
			label: "Disponibles",
			value: counts.available,
			icon: KPI_ICONS.available,
			color: "var(--sf-success)",
			sub: counts.total
				? `${Math.round((counts.available / counts.total) * 100)}% du parc`
				: undefined,
			subColor: "var(--sf-fg-muted)",
		},
		{
			key: "broken",
			label: "En panne",
			value: counts.broken,
			icon: KPI_ICONS.broken,
			color: "var(--sf-danger)",
			sub: `${openIncidentTotal} incident${openIncidentTotal > 1 ? "s" : ""} ouvert${openIncidentTotal > 1 ? "s" : ""}`,
			subColor: "var(--sf-danger)",
		},
		{
			key: "maintenance",
			label: "En maintenance",
			value: counts.maintenance,
			icon: KPI_ICONS.maintenance,
			color: "var(--sf-warning)",
			sub: undefined,
			subColor: undefined,
		},
	];

	return (
		<div style={{ display: "flex", height: "100vh", background: "var(--sf-canvas)" }}>
			<Sidebar equipmentCount={counts.total} openIncidentCount={openIncidentTotal} />
			<main
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					minWidth: 0,
					overflow: "hidden",
				}}
			>
				<div style={{ flex: 1, overflowY: "auto", padding: "26px 28px 40px" }}>
					{/* En-tête */}
					<h1
						style={{
							fontSize: 22,
							fontWeight: 600,
							letterSpacing: "-0.02em",
							color: "var(--sf-fg)",
							margin: 0,
						}}
					>
						Vue d'ensemble du parc
					</h1>
					<p style={{ fontSize: 13, color: "var(--sf-fg-muted)", margin: "4px 0 0" }}>
						{new Date().toLocaleDateString("fr-FR", {
							weekday: "long",
							day: "numeric",
							month: "long",
							year: "numeric",
						})}{" "}
						· Connecté en tant que{" "}
						<span style={{ color: "var(--sf-fg)", fontWeight: 500 }}>
							{currentUser?.name}{" "}
							({currentUser?.role === "admin" ? "admin" : "technicien"})
						</span>
					</p>

					{/* KPI */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(4, 1fr)",
							gap: 12,
							marginTop: 22,
						}}
					>
						{kpis.map((k) => (
							<div
								key={k.key}
								style={{
									background: "var(--sf-bg)",
									border: "1px solid var(--sf-border)",
									borderRadius: 12,
									padding: "16px 18px",
									display: "flex",
									flexDirection: "column",
									gap: 10,
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: 9 }}>
									<span
										style={{
											width: 30,
											height: 30,
											borderRadius: 9,
											background: "var(--sf-surface)",
											border: "1px solid var(--sf-border)",
											display: "inline-flex",
											alignItems: "center",
											justifyContent: "center",
											color: k.color,
											flexShrink: 0,
										}}
									>
										{k.icon}
									</span>
									<span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--sf-fg-soft)" }}>
										{k.label}
									</span>
								</div>
								<span
									style={{
										fontSize: 30,
										fontWeight: 600,
										letterSpacing: "-0.02em",
										color: "var(--sf-fg)",
										fontVariantNumeric: "tabular-nums",
										lineHeight: 1,
									}}
								>
									{k.value}
								</span>
								{k.sub && (
									<span style={{ fontSize: 11.5, color: k.subColor }}>{k.sub}</span>
								)}
							</div>
						))}
					</div>

					{/* Corps : table + colonne droite */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "minmax(0, 1fr) 320px",
							gap: 16,
							marginTop: 16,
							alignItems: "start",
						}}
					>
						{/* Parc récent */}
						<section
							aria-label="Parc informatique récent"
							style={{
								background: "var(--sf-bg)",
								border: "1px solid var(--sf-border)",
								borderRadius: 12,
								overflow: "hidden",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 10,
									padding: "14px 16px",
									borderBottom: "1px solid var(--sf-border)",
								}}
							>
								<h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: "var(--sf-fg)" }}>
									Parc informatique récent
								</h2>
								<span
									style={{
										fontFamily: "var(--sf-mono)",
										fontSize: 10.5,
										color: "var(--sf-fg-muted)",
										background: "var(--sf-surface)",
										border: "1px solid var(--sf-border)",
										borderRadius: 6,
										padding: "2px 7px",
									}}
								>
									{recent.length} éléments
								</span>
								<span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--sf-fg-muted)" }}>
									Trié par dernière activité
								</span>
							</div>
							<div style={{ overflowX: "auto" }}>
								<table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
									<thead>
										<tr>
											<th style={dashThStyle}>ID</th>
											<th style={dashThStyle}>Équipement</th>
											<th style={dashThStyle}>Type</th>
											<th style={dashThStyle}>Assigné à</th>
											<th style={dashThStyle}>Statut</th>
											<th style={dashThStyle}>Actions</th>
										</tr>
									</thead>
									<tbody>
										{recent.map((e) => (
											<tr key={e.id}>
												<td style={{ ...dashTdStyle, fontFamily: "var(--sf-mono)", fontSize: 11.5, color: "var(--sf-fg-faint)" }}>
													{e.id.slice(0, 8)}
												</td>
												<td style={dashTdStyle}>
													<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
														<span
															style={{
																width: 30,
																height: 30,
																borderRadius: 8,
																background: "var(--sf-surface)",
																border: "1px solid var(--sf-border)",
																display: "inline-flex",
																alignItems: "center",
																justifyContent: "center",
																color: "var(--sf-fg)",
																flexShrink: 0,
															}}
														>
															<TypeIcon type={e.type} size={14} />
														</span>
														<div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
															<Link
																to="/equipment/$id"
																params={{ id: e.id }}
																style={{
																	fontWeight: 500,
																	color: "var(--sf-fg)",
																	textDecoration: "none",
																	letterSpacing: "-0.005em",
																}}
															>
																{e.name}
															</Link>
															<span style={{ fontSize: 11, fontFamily: "var(--sf-mono)", color: "var(--sf-fg-muted)" }}>
																{e.serial_number ?? "—"}
															</span>
														</div>
													</div>
												</td>
												<td style={dashTdStyle}>
													<span
														style={{
															fontSize: 11.5,
															color: "var(--sf-fg-soft)",
															background: "var(--sf-surface)",
															border: "1px solid var(--sf-border)",
															borderRadius: 6,
															padding: "3px 8px",
														}}
													>
														{TYPE_LABELS[e.type] ?? e.type}
													</span>
												</td>
												<td style={{ ...dashTdStyle, color: e.assigned_to ? "var(--sf-fg)" : "var(--sf-fg-faint)" }}>
													{assignedLabel(e)}
												</td>
												<td style={dashTdStyle}>
													<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
														<StatusBadge status={e.status} />
														<OpenIncidentBadge count={incidentCountById.get(e.id) ?? 0} />
													</span>
												</td>
												<td style={dashTdStyle}>
													<RowAction
														equipment={e}
														releasing={releasingId === e.id}
														onRelease={() => release(e.id)}
													/>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>

						{/* Colonne droite */}
						<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
							<section
								aria-label="Actions rapides"
								style={{
									background: "var(--sf-bg)",
									border: "1px solid var(--sf-border)",
									borderRadius: 12,
									padding: "16px 18px",
									display: "flex",
									flexDirection: "column",
									gap: 12,
								}}
							>
								<h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: "var(--sf-fg)" }}>
									Actions rapides
								</h2>
								<Link
									to="/equipment/new"
									style={{
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
										gap: 8,
										padding: "11px 16px",
										border: "1px solid var(--sf-primary-strong)",
										background:
											"linear-gradient(135deg, var(--sf-primary), var(--sf-primary-strong))",
										color: "white",
										borderRadius: 9,
										fontSize: 13.5,
										fontWeight: 500,
										textDecoration: "none",
										boxShadow:
											"0 4px 16px rgba(99,102,241,.3), inset 0 1px 0 rgba(255,255,255,.15)",
									}}
								>
									<PlusIcon size={15} stroke="white" />
									Ajouter un équipement
								</Link>
								<p style={{ margin: 0, fontSize: 12, color: "var(--sf-fg-muted)", lineHeight: 1.5 }}>
									Création guidée : identification, caractéristiques, QR généré
									automatiquement.
								</p>
							</section>

							<section
								aria-label="Incidents ouverts"
								style={{
									background: "var(--sf-bg)",
									border: "1px solid var(--sf-border)",
									borderRadius: 12,
									overflow: "hidden",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										padding: "14px 16px",
										borderBottom:
											openIncidents.length > 0 ? "1px solid var(--sf-border)" : "none",
									}}
								>
									<span style={{ color: "var(--sf-danger)", display: "inline-flex" }}>
										{KPI_ICONS.broken}
									</span>
									<h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: "var(--sf-fg)" }}>
										Incidents ouverts
									</h2>
									<span
										style={{
											marginLeft: "auto",
											fontFamily: "var(--sf-mono)",
											fontSize: 11,
											color: "var(--sf-danger)",
											background: "var(--sf-danger-tint)",
											borderRadius: 999,
											padding: "2px 8px",
										}}
									>
										{openIncidentTotal}
									</span>
								</div>
								{openIncidents.length === 0 && (
									<p style={{ margin: 0, padding: "14px 16px", fontSize: 12.5, color: "var(--sf-fg-muted)" }}>
										Aucun incident ouvert.
									</p>
								)}
								{openIncidents.map((inc) => (
									<div
										key={inc.id}
										style={{
											padding: "12px 16px",
											borderBottom: "1px solid var(--sf-border-soft)",
											display: "flex",
											flexDirection: "column",
											gap: 4,
										}}
									>
										<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
											<span style={{ fontFamily: "var(--sf-mono)", fontSize: 10.5, color: "var(--sf-fg-faint)" }}>
												{inc.id.slice(0, 8)}
											</span>
											<span
												style={{
													fontSize: 10.5,
													fontWeight: 600,
													color: inc.status === "open" ? "var(--sf-danger)" : "var(--sf-warning)",
													background:
														inc.status === "open" ? "var(--sf-danger-tint)" : "var(--sf-warning-tint)",
													borderRadius: 999,
													padding: "1px 7px",
												}}
											>
												{inc.status === "open" ? "Ouvert" : "En cours"}
											</span>
											<span style={{ marginLeft: "auto", fontSize: 10.5, color: "var(--sf-fg-faint)" }}>
												{new Date(inc.created_at).toLocaleDateString("fr-FR", {
													day: "numeric",
													month: "short",
												})}
											</span>
										</div>
										<span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--sf-fg-soft)" }}>
											{inc.description ?? "Sans description"}
										</span>
										<span style={{ fontSize: 11.5, color: "var(--sf-fg-muted)" }}>
											{inc.equipment_name}
										</span>
									</div>
								))}
								{currentUser?.role === "admin" && openIncidents.length > 0 && (
									<Link
										to="/incidents"
										style={{
											display: "block",
											padding: "10px 16px",
											fontSize: 12,
											fontWeight: 500,
											color: "var(--sf-primary-soft)",
											textDecoration: "none",
										}}
									>
										Gérer les incidents →
									</Link>
								)}
							</section>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

/** Action contextuelle du parc récent : Libérer (direct) / Assigner / Réparer (fiche). */
function RowAction({
	equipment,
	releasing,
	onRelease,
}: {
	equipment: EquipmentTable;
	releasing: boolean;
	onRelease: () => void;
}) {
	const btnStyle: React.CSSProperties = {
		padding: "5px 11px",
		borderRadius: 7,
		border: "1px solid var(--sf-border)",
		background: "var(--sf-bg)",
		color: "var(--sf-fg-soft)",
		fontFamily: "inherit",
		fontSize: 12,
		fontWeight: 500,
		cursor: "pointer",
		textDecoration: "none",
		display: "inline-flex",
	};

	if (equipment.status === "assigned") {
		return (
			<button
				type="button"
				disabled={releasing}
				onClick={onRelease}
				style={{ ...btnStyle, opacity: releasing ? 0.6 : 1 }}
			>
				{releasing ? "…" : "Libérer"}
			</button>
		);
	}
	const label =
		equipment.status === "available"
			? "Assigner"
			: equipment.status === "broken"
				? "Réparer"
				: "Voir";
	return (
		<Link
			to="/equipment/$id"
			params={{ id: equipment.id }}
			style={{
				...btnStyle,
				...(equipment.status === "broken"
					? { color: "var(--sf-danger)", borderColor: "var(--sf-danger-border)" }
					: equipment.status === "available"
						? { color: "var(--sf-primary-soft)", borderColor: "var(--sf-primary-border)" }
						: {}),
			}}
		>
			{label}
		</Link>
	);
}

function MobileHome({ equipment }: { equipment: Awaited<ReturnType<typeof getEquipments>> }) {
	const recent = equipment.slice(0, 3);

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "var(--sf-canvas)",
				display: "flex",
				flexDirection: "column",
				fontFamily: "var(--sf-sans)",
				overflowY: "auto",
			}}
		>
			{/* Header */}
			<header
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "14px 18px 10px",
					background: "var(--sf-bg)",
					borderBottom: "1px solid var(--sf-border)",
					flexShrink: 0,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<StockFlowLogo size={20} />
					<span
						style={{
							fontSize: 15,
							fontWeight: 600,
							letterSpacing: "-0.01em",
							color: "var(--sf-fg)",
						}}
					>
						StockFlow
					</span>
				</div>
				<button
					type="button"
					aria-label="Profil"
					style={{
						width: 34,
						height: 34,
						borderRadius: "50%",
						background: "var(--sf-surface)",
						border: "1px solid var(--sf-border)",
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						cursor: "pointer",
					}}
				>
					<svg
						width={15}
						height={15}
						viewBox="0 0 24 24"
						fill="none"
						stroke="var(--sf-fg-muted)"
						strokeWidth={1.6}
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
				</button>
			</header>

			{/* Greeting */}
			<div style={{ padding: "20px 18px 8px", flexShrink: 0 }}>
				<div
					style={{
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: "var(--sf-fg-muted)",
					}}
				>
					Bonjour
				</div>
				<div
					style={{
						fontSize: 22,
						fontWeight: 600,
						letterSpacing: "-0.02em",
						marginTop: 4,
						lineHeight: 1.2,
						color: "var(--sf-fg)",
					}}
				>
					Que souhaitez-vous
					<br />
					faire ?
				</div>
			</div>

			{/* Action tiles */}
			<div
				style={{
					padding: "16px 14px",
					display: "flex",
					flexDirection: "column",
					gap: 10,
					flexShrink: 0,
				}}
			>
				{/* Scan QR */}
				<Link to="/scan" style={{ textDecoration: "none" }}>
					<div
						style={{
							padding: "16px",
							background: "var(--sf-surface-2)",
							color: "white",
							border: "1px solid var(--sf-border-strong)",
							borderRadius: 14,
							display: "flex",
							alignItems: "center",
							gap: 14,
						}}
					>
						<span style={darkTileIcon}>
							<ScanIcon size={20} stroke="white" />
						</span>
						<span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
							<span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
								Scanner un QR
							</span>
							<span style={{ fontSize: 12, color: "var(--sf-fg-muted)" }}>
								Identifier un équipement
							</span>
						</span>
						<span style={{ marginLeft: "auto" }}>
							<ChevronRightIcon size={16} stroke="white" />
						</span>
					</div>
				</Link>

				{/* Add equipment */}
				<Link to="/equipment/new" style={{ textDecoration: "none" }}>
					<div style={tileBtnStyle}>
						<span style={{ ...tileIconBase, background: "var(--sf-primary-tint)" }}>
							<PlusIcon size={20} stroke="var(--sf-primary-soft)" />
						</span>
						<span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
							<span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--sf-fg)" }}>
								Ajouter un équipement
							</span>
							<span style={{ fontSize: 12, color: "var(--sf-fg-muted)" }}>
								QR généré automatiquement
							</span>
						</span>
						<span style={{ marginLeft: "auto" }}>
							<ChevronRightIcon size={14} stroke="var(--sf-fg-muted)" />
						</span>
					</div>
				</Link>

				{/* Report incident */}
				<div style={tileBtnStyle}>
					<span style={{ ...tileIconBase, background: "var(--sf-danger-tint)" }}>
						<AlertIcon size={20} stroke="var(--sf-danger)" />
					</span>
					<span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
						<span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--sf-fg)" }}>
							Signaler une panne
						</span>
						<span style={{ fontSize: 12, color: "var(--sf-fg-muted)" }}>
							Incidents ouverts
						</span>
					</span>
					<span style={{ marginLeft: "auto" }}>
						<ChevronRightIcon size={14} stroke="var(--sf-fg-muted)" />
					</span>
				</div>
			</div>

			{/* Recent equipment */}
			{recent.length > 0 && (
				<>
					<div
						style={{
							padding: "12px 18px 8px",
							fontSize: 11,
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "var(--sf-fg-muted)",
							flexShrink: 0,
						}}
					>
						Vu récemment
					</div>
					<div
						style={{
							padding: "0 14px",
							display: "flex",
							flexDirection: "column",
							gap: 8,
							flexShrink: 0,
						}}
					>
						{recent.map((item) => (
							<Link
								key={item.id}
								to="/equipment/$id"
								params={{ id: item.id }}
								style={{ textDecoration: "none" }}
							>
								<div
									style={{
										padding: "12px 14px",
										background: "var(--sf-bg)",
										border: "1px solid var(--sf-border)",
										borderRadius: 12,
										display: "flex",
										alignItems: "center",
										gap: 12,
									}}
								>
									<span
										style={{
											width: 36,
											height: 36,
											borderRadius: 9,
											background: "var(--sf-surface)",
											border: "1px solid var(--sf-border)",
											display: "inline-flex",
											alignItems: "center",
											justifyContent: "center",
											color: "var(--sf-fg)",
											flexShrink: 0,
										}}
									>
										<TypeIcon type={item.type} size={16} />
									</span>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div
											style={{
												fontSize: 13,
												fontWeight: 500,
												letterSpacing: "-0.005em",
												whiteSpace: "nowrap",
												overflow: "hidden",
												textOverflow: "ellipsis",
												color: "var(--sf-fg)",
											}}
										>
											{item.name}
										</div>
										<div
											style={{
												fontSize: 11,
												fontFamily: "var(--sf-mono)",
												color: "var(--sf-fg-muted)",
												marginTop: 1,
											}}
										>
											{item.id.slice(0, 8)}
										</div>
									</div>
									<StatusBadge status={item.status} />
								</div>
							</Link>
						))}
					</div>
				</>
			)}

			<div style={{ flex: 1 }} />
			<MobileBottomNav active="home" />
		</div>
	);
}

/* ── Inline SVG helpers ─────────────────────────────────────────── */

function ScanIcon({ size = 20, stroke = "currentColor" }: { size?: number; stroke?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
			<path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
			<line x1="7" y1="12" x2="17" y2="12" />
		</svg>
	);
}

function PlusIcon({ size = 20, stroke = "currentColor" }: { size?: number; stroke?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);
}

function AlertIcon({ size = 20, stroke = "currentColor" }: { size?: number; stroke?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
			<line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
	);
}

function ChevronRightIcon({ size = 16, stroke = "currentColor" }: { size?: number; stroke?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<polyline points="9 18 15 12 9 6" />
		</svg>
	);
}

/* ── Style constants ────────────────────────────────────────────── */

const darkTileIcon: React.CSSProperties = {
	width: 40,
	height: 40,
	borderRadius: 10,
	background: "rgba(255,255,255,.10)",
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	flexShrink: 0,
};

const tileBtnStyle: React.CSSProperties = {
	padding: "14px",
	background: "var(--sf-bg)",
	border: "1px solid var(--sf-border)",
	borderRadius: 14,
	display: "flex",
	alignItems: "center",
	gap: 12,
	cursor: "pointer",
};

const tileIconBase: React.CSSProperties = {
	width: 40,
	height: 40,
	borderRadius: 10,
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	flexShrink: 0,
};
