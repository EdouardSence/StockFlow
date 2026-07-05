import type { EquipmentTable } from "../db/types";

/**
 * Palette sémantique par statut équipement — reprise fidèle de
 * design-reference/StockFlow.dc.html (STATUS map). Source unique pour ce
 * composant et pour tout autre écran affichant un statut (KPI, tuiles
 * d'action) : ne pas dupliquer ces valeurs ailleurs, importer STATUS_META.
 */
export const STATUS_META: Record<
	EquipmentTable["status"],
	{ label: string; dot: string; bg: string; fg: string; border: string }
> = {
	available: {
		label: "Disponible",
		dot: "#10b981",
		bg: "rgba(16,185,129,.1)",
		fg: "#34d399",
		border: "rgba(16,185,129,.28)",
	},
	assigned: {
		label: "Assigné",
		dot: "#6366f1",
		bg: "rgba(99,102,241,.1)",
		fg: "#a5b4fc",
		border: "rgba(99,102,241,.28)",
	},
	broken: {
		label: "En panne",
		dot: "#f43f5e",
		bg: "rgba(244,63,94,.1)",
		fg: "#fda4af",
		border: "rgba(244,63,94,.28)",
	},
	maintenance: {
		label: "Maintenance",
		dot: "#f59e0b",
		bg: "rgba(245,158,11,.1)",
		fg: "#fcd34d",
		border: "rgba(245,158,11,.28)",
	},
};

/**
 * Avertissement discret : incidents ouverts/en cours sur un équipement.
 * Purement informatif — n'empêche aucune action (choix « manuel » : l'admin
 * garde la décision d'assigner ou non).
 */
export function OpenIncidentBadge({ count }: { count: number }) {
	if (count <= 0) return null;
	return (
		<span
			title={`${count} incident${count > 1 ? "s" : ""} ouvert${count > 1 ? "s" : ""} ou en cours`}
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 4,
				padding: "2px 7px",
				borderRadius: 999,
				background: "rgba(245,158,11,.1)",
				color: "#fcd34d",
				border: "1px solid rgba(245,158,11,.28)",
				fontSize: 11,
				fontWeight: 600,
				lineHeight: 1.2,
				whiteSpace: "nowrap",
				fontVariantNumeric: "tabular-nums",
			}}
		>
			<svg
				width={11}
				height={11}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
				<line x1="12" y1="9" x2="12" y2="13" />
				<line x1="12" y1="17" x2="12.01" y2="17" />
			</svg>
			{count}
		</span>
	);
}

interface StatusBadgeProps {
	status: EquipmentTable["status"];
	size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
	const meta = STATUS_META[status];
	if (!meta) return null;
	const padY = size === "sm" ? 2 : 4;
	const padX = size === "sm" ? 8 : 10;
	const fs = size === "sm" ? 12 : 13;
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 6,
				padding: `${padY}px ${padX}px`,
				borderRadius: 999,
				background: meta.bg,
				color: meta.fg,
				border: `1px solid ${meta.border}`,
				fontSize: fs,
				fontWeight: 500,
				lineHeight: 1.2,
				letterSpacing: "-0.005em",
				whiteSpace: "nowrap",
			}}
		>
			<span
				style={{
					width: 6,
					height: 6,
					borderRadius: "50%",
					background: meta.dot,
					flex: "none",
				}}
			/>
			{meta.label}
		</span>
	);
}
