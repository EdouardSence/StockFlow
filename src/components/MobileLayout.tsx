import type { EquipmentTable } from "../db/types";

export function StockFlowLogo({ size = 20 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<rect x="3" y="3" width="11" height="11" rx="2" fill="#6366f1" />
			<rect x="10" y="10" width="11" height="11" rx="2" fill="#4338ca" />
		</svg>
	);
}

export function TypeIcon({ type, size = 18 }: { type: EquipmentTable["type"]; size?: number }) {
	const s = {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.6,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};
	switch (type) {
		case "screen":
			return (
				<svg {...s} aria-hidden="true">
					<rect x="2" y="3" width="20" height="14" rx="2" />
					<line x1="8" y1="21" x2="16" y2="21" />
					<line x1="12" y1="17" x2="12" y2="21" />
				</svg>
			);
		case "printer":
			return (
				<svg {...s} aria-hidden="true">
					<polyline points="6 9 6 2 18 2 18 9" />
					<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
					<rect x="6" y="14" width="12" height="8" />
				</svg>
			);
		case "pc":
			return (
				<svg {...s} aria-hidden="true">
					<rect x="2" y="3" width="20" height="14" rx="2" />
					<line x1="8" y1="21" x2="16" y2="21" />
					<line x1="12" y1="17" x2="12" y2="21" />
				</svg>
			);
		default:
			return (
				<svg {...s} aria-hidden="true">
					<rect x="3" y="3" width="18" height="18" rx="2" />
				</svg>
			);
	}
}

type NavTab = {
	href: string | null;
	iconName: "home" | "scan" | "box" | "user";
	label: string;
	active?: boolean;
};

function NavIcon({
	name,
	stroke,
}: { name: NavTab["iconName"]; stroke: string }) {
	const s = {
		width: 22,
		height: 22,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke,
		strokeWidth: 1.6,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};
	switch (name) {
		case "home":
			return (
				<svg {...s} aria-hidden="true">
					<rect x="3" y="3" width="7" height="9" rx="1.5" />
					<rect x="14" y="3" width="7" height="5" rx="1.5" />
					<rect x="14" y="12" width="7" height="9" rx="1.5" />
					<rect x="3" y="16" width="7" height="5" rx="1.5" />
				</svg>
			);
		case "scan":
			return (
				<svg {...s} aria-hidden="true">
					<path d="M3 7V5a2 2 0 0 1 2-2h2" />
					<path d="M17 3h2a2 2 0 0 1 2 2v2" />
					<path d="M21 17v2a2 2 0 0 1-2 2h-2" />
					<path d="M7 21H5a2 2 0 0 1-2-2v-2" />
					<line x1="7" y1="12" x2="17" y2="12" />
				</svg>
			);
		case "box":
			return (
				<svg {...s} aria-hidden="true">
					<path d="M21 8 12 3 3 8v8l9 5 9-5z" />
					<path d="m3.3 8 8.7 5 8.7-5" />
					<path d="M12 13v8" />
				</svg>
			);
		case "user":
			return (
				<svg {...s} aria-hidden="true">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			);
	}
}

export function MobileBottomNav({ active }: { active: "home" | "scan" | "stock" | "profile" }) {
	const tabs: NavTab[] = [
		{ href: "/", iconName: "home", label: "Accueil", active: active === "home" },
		{ href: "/scan", iconName: "scan", label: "Scanner", active: active === "scan" },
		{ href: "/equipment", iconName: "box", label: "Stock", active: active === "stock" },
		{ href: null, iconName: "user", label: "Profil", active: active === "profile" },
	];

	return (
		<nav
			style={{
				padding: "10px 14px 22px",
				background: "var(--sf-bg)",
				borderTop: "1px solid var(--sf-border)",
				display: "flex",
				justifyContent: "space-around",
				flexShrink: 0,
			}}
		>
			{tabs.map((t) => {
				const color = t.active ? "var(--sf-fg)" : "var(--sf-fg-muted)";
				const inner = (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 3,
							color,
							fontSize: 10.5,
							fontWeight: 500,
						}}
					>
						<NavIcon name={t.iconName} stroke={color} />
						{t.label}
					</div>
				);
				if (t.href) {
					return (
						<a key={t.label} href={t.href} style={{ textDecoration: "none" }}>
							{inner}
						</a>
					);
				}
				return <div key={t.label}>{inner}</div>;
			})}
		</nav>
	);
}
