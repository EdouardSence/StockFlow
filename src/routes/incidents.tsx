import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import type { IncidentsTable } from "../db/types";
import { advanceIncidentFn, listIncidentsFn } from "../lib/incidents";

export const Route = createFileRoute("/incidents")({
	beforeLoad: ({ context }) => {
		if (context.user?.role !== "admin") throw redirect({ to: "/" });
	},
	loader: () => listIncidentsFn(),
	component: IncidentsPage,
});

const INC_STATUS_META: Record<
	IncidentsTable["status"],
	{ label: string; dot: string; bg: string; fg: string; border: string }
> = {
	open: {
		label: "Ouvert",
		dot: "#f43f5e",
		bg: "rgba(244,63,94,.12)",
		fg: "#fda4af",
		border: "rgba(244,63,94,.28)",
	},
	in_progress: {
		label: "En cours",
		dot: "#f59e0b",
		bg: "rgba(245,158,11,.12)",
		fg: "#fcd34d",
		border: "rgba(245,158,11,.28)",
	},
	resolved: {
		label: "Résolu",
		dot: "#10b981",
		bg: "rgba(16,185,129,.12)",
		fg: "#34d399",
		border: "rgba(16,185,129,.28)",
	},
};

function IncidentBadge({ status }: { status: IncidentsTable["status"] }) {
	const m = INC_STATUS_META[status];
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 5,
				fontSize: 10.5,
				fontWeight: 600,
				padding: "2px 8px",
				borderRadius: 999,
				background: m.bg,
				color: m.fg,
				border: `1px solid ${m.border}`,
			}}
		>
			<span
				style={{
					width: 5,
					height: 5,
					borderRadius: 999,
					background: m.dot,
				}}
			/>
			{m.label}
		</span>
	);
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
	});
}

type IncidentRow = Awaited<ReturnType<typeof listIncidentsFn>>[number];

function IncidentsPage() {
	const incidents = Route.useLoaderData();
	const router = useRouter();
	const [resolvedExpanded, setResolvedExpanded] = useState(false);
	const [advancingId, setAdvancingId] = useState<string | null>(null);

	const active = incidents.filter((i) => i.status !== "resolved");
	const resolved = incidents.filter((i) => i.status === "resolved");

	async function advance(id: string) {
		setAdvancingId(id);
		try {
			await advanceIncidentFn({ data: { id } });
			await router.invalidate();
		} finally {
			setAdvancingId(null);
		}
	}

	return (
		<div style={{ display: "flex", height: "100vh", background: "var(--sf-canvas)" }}>
			<Sidebar openIncidentCount={active.length} />
			<main
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					minWidth: 0,
					overflow: "hidden",
				}}
			>
				<header
					style={{
						display: "flex",
						alignItems: "center",
						padding: "16px 28px",
						borderBottom: "1px solid var(--sf-border)",
						background: "var(--sf-bg)",
					}}
				>
					<h1 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--sf-fg)" }}>
						Incidents
					</h1>
				</header>

				<div style={{ flex: 1, overflowY: "auto", padding: 28, maxWidth: 720 }}>
					<section
						aria-label="Incidents ouverts"
						style={{
							background: "var(--sf-bg)",
							border: "1px solid var(--sf-border)",
							borderRadius: 16,
							overflow: "hidden",
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 9,
								padding: "16px 20px",
								borderBottom: "1px solid var(--sf-border)",
							}}
						>
							<h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--sf-fg)" }}>
								Incidents ouverts
							</h2>
							<span
								style={{
									fontFamily: "var(--sf-mono)",
									fontSize: 11,
									color: "var(--sf-danger)",
									background: "var(--sf-danger-tint)",
									borderRadius: 999,
									padding: "3px 8px",
									marginLeft: "auto",
								}}
							>
								{active.length}
							</span>
						</div>

						{active.length === 0 && (
							<p style={{ margin: 0, padding: 20, fontSize: 13, color: "var(--sf-fg-muted)" }}>
								Aucun incident ouvert.
							</p>
						)}

						{active.map((inc) => (
							<IncidentRowView
								key={inc.id}
								incident={inc}
								advancing={advancingId === inc.id}
								onAdvance={() => advance(inc.id)}
							/>
						))}

						{resolved.length > 0 && (
							<>
								<button
									type="button"
									aria-expanded={resolvedExpanded}
									aria-label="Afficher ou masquer les incidents résolus récemment"
									onClick={() => setResolvedExpanded((v) => !v)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										width: "100%",
										padding: "12px 20px",
										background: "rgba(39,39,42,.25)",
										border: "none",
										borderTop: active.length > 0 ? "none" : "1px solid var(--sf-border)",
										borderBottom: resolvedExpanded ? "1px solid var(--sf-border-soft)" : "none",
										cursor: "pointer",
										fontFamily: "inherit",
										textAlign: "left",
									}}
								>
									<span
										style={{
											color: "var(--sf-fg-faint)",
											display: "inline-flex",
											transform: resolvedExpanded ? "rotate(180deg)" : "none",
											transition: "transform .2s",
										}}
										aria-hidden="true"
									>
										▾
									</span>
									<span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--sf-fg-muted)" }}>
										Résolus récemment
									</span>
									<span
										style={{
											fontFamily: "var(--sf-mono)",
											fontSize: 11,
											color: "var(--sf-success)",
											background: "var(--sf-success-tint)",
											borderRadius: 999,
											padding: "2px 8px",
											marginLeft: "auto",
										}}
									>
										{resolved.length}
									</span>
								</button>
								{resolvedExpanded &&
									resolved.map((inc) => <ResolvedIncidentRow key={inc.id} incident={inc} />)}
							</>
						)}
					</section>
				</div>
			</main>
		</div>
	);
}

function IncidentRowView({
	incident,
	advancing,
	onAdvance,
}: {
	incident: IncidentRow;
	advancing: boolean;
	onAdvance: () => void;
}) {
	const advanceLabel = incident.status === "open" ? "Prendre en charge" : "Marquer résolu";
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 7,
				padding: "14px 20px",
				borderBottom: "1px solid var(--sf-border-soft)",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
				<span style={{ fontFamily: "var(--sf-mono)", fontSize: 11, color: "var(--sf-fg-faint)" }}>
					{incident.id.slice(0, 8)}
				</span>
				<IncidentBadge status={incident.status} />
				<span style={{ fontSize: 11, color: "var(--sf-fg-faint)", marginLeft: "auto" }}>
					{formatDate(incident.created_at)}
				</span>
			</div>
			<span style={{ fontSize: 13, fontWeight: 600, color: "var(--sf-fg-soft)" }}>
				{incident.description ?? "Sans description"}
			</span>
			<span style={{ fontSize: 12, color: "var(--sf-fg-muted)" }}>
				{incident.equipment_brand} {incident.equipment_model} · signalé par{" "}
				{incident.reported_by_name}
			</span>
			<button
				type="button"
				onClick={onAdvance}
				disabled={advancing}
				style={{
					alignSelf: "flex-start",
					marginTop: 2,
					fontFamily: "inherit",
					fontSize: 11.5,
					fontWeight: 600,
					color: incident.status === "open" ? "var(--sf-warning)" : "var(--sf-success)",
					background: incident.status === "open" ? "var(--sf-warning-tint)" : "var(--sf-success-tint)",
					border: `1px solid ${incident.status === "open" ? "var(--sf-warning-border)" : "var(--sf-success-border)"}`,
					borderRadius: 8,
					padding: "5px 10px",
					cursor: advancing ? "default" : "pointer",
					opacity: advancing ? 0.6 : 1,
				}}
			>
				{advancing ? "…" : advanceLabel}
			</button>
		</div>
	);
}

function ResolvedIncidentRow({ incident }: { incident: IncidentRow }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 5,
				padding: "12px 20px",
				borderBottom: "1px solid var(--sf-border-soft)",
				opacity: 0.75,
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<span style={{ fontFamily: "var(--sf-mono)", fontSize: 11, color: "var(--sf-fg-faint)" }}>
					{incident.id.slice(0, 8)}
				</span>
				<IncidentBadge status={incident.status} />
				<span style={{ fontSize: 11, color: "var(--sf-fg-faint)", marginLeft: "auto" }}>
					résolu {incident.resolved_at ? formatDate(incident.resolved_at) : ""}
				</span>
			</div>
			<span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--sf-fg-muted)" }}>
				{incident.description ?? "Sans description"}
			</span>
			<span style={{ fontSize: 11.5, color: "var(--sf-fg-faint)" }}>
				{incident.equipment_brand} {incident.equipment_model}
			</span>
		</div>
	);
}
