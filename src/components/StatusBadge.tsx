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
