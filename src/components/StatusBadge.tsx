import type { EquipmentTable } from "../db/types";

const STATUS_META: Record<
	EquipmentTable["status"],
	{ label: string; dot: string; bg: string; fg: string; border: string }
> = {
	available: {
		label: "Disponible",
		dot: "oklch(0.68 0.15 152)",
		bg: "oklch(0.96 0.03 152)",
		fg: "oklch(0.32 0.08 152)",
		border: "oklch(0.86 0.05 152)",
	},
	assigned: {
		label: "Assigné",
		dot: "oklch(0.58 0.16 255)",
		bg: "oklch(0.96 0.025 255)",
		fg: "oklch(0.32 0.10 255)",
		border: "oklch(0.86 0.05 255)",
	},
	broken: {
		label: "En panne",
		dot: "oklch(0.62 0.20 25)",
		bg: "oklch(0.96 0.03 25)",
		fg: "oklch(0.40 0.14 25)",
		border: "oklch(0.86 0.06 25)",
	},
	maintenance: {
		label: "Maintenance",
		dot: "oklch(0.72 0.15 75)",
		bg: "oklch(0.96 0.04 85)",
		fg: "oklch(0.38 0.10 70)",
		border: "oklch(0.86 0.07 80)",
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
