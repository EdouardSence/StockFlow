import { Link, useRouterState } from "@tanstack/react-router";
import {
	AlertTriangle,
	LayoutDashboard,
	LogOut,
	Package,
	Search,
	Settings,
	Users,
} from "lucide-react";
import { logoutFn } from "../lib/auth";

function StockFlowLogo() {
	return (
		<svg width={22} height={22} viewBox="0 0 24 24" fill="none" role="img">
			<title>StockFlow</title>
			<rect x="3" y="3" width="11" height="11" rx="2" fill="#6366f1" />
			<rect x="10" y="10" width="11" height="11" rx="2" fill="#4338ca" />
		</svg>
	);
}

type ValidTo =
	| "/"
	| "/equipment"
	| "/equipment/new"
	| "/incidents"
	| "/account";

type NavItem = {
	path: ValidTo | null;
	label: string;
	icon: React.ReactNode;
	count?: number;
	accent?: boolean;
};

export function Sidebar({
	equipmentCount,
	openIncidentCount,
}: {
	equipmentCount?: number;
	openIncidentCount?: number;
}) {
	const { location } = useRouterState();
	const pathname = location.pathname;

	const navItems: NavItem[] = [
		{
			path: "/",
			label: "Tableau de bord",
			icon: <LayoutDashboard size={15} />,
		},
		{
			path: "/equipment",
			label: "Équipements",
			icon: <Package size={15} />,
			count: equipmentCount,
		},
		{ path: null, label: "Utilisateurs", icon: <Users size={15} />, count: 18 },
		{
			path: "/incidents",
			label: "Incidents",
			icon: <AlertTriangle size={15} />,
			count: openIncidentCount,
			accent: true,
		},
		{ path: "/account", label: "Paramètres", icon: <Settings size={15} /> },
	];

	function isActive(path: ValidTo | null) {
		if (!path) return false;
		if (path === "/") return pathname === "/";
		return pathname.startsWith(path);
	}

	return (
		<aside
			style={{
				width: 248,
				flexShrink: 0,
				background: "var(--sf-bg)",
				borderRight: "1px solid var(--sf-border)",
				display: "flex",
				flexDirection: "column",
				padding: "20px 14px",
				height: "100%",
				overflowY: "auto",
			}}
		>
			{/* Brand */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "4px 8px 24px",
				}}
			>
				<StockFlowLogo />
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
				<span
					style={{
						marginLeft: "auto",
						fontSize: 10,
						fontWeight: 500,
						letterSpacing: "0.04em",
						color: "var(--sf-fg-muted)",
						border: "1px solid var(--sf-border)",
						borderRadius: 4,
						padding: "2px 6px",
						textTransform: "uppercase",
					}}
				>
					Atelier IT
				</span>
			</div>

			{/* Search mock */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					padding: "8px 10px",
					background: "var(--sf-surface)",
					border: "1px solid var(--sf-border)",
					borderRadius: 8,
					marginBottom: 18,
					cursor: "text",
				}}
			>
				<Search size={14} color="var(--sf-fg-muted)" />
				<span style={{ fontSize: 13, color: "var(--sf-fg-muted)", flex: 1 }}>
					Rechercher…
				</span>
				<span
					style={{
						fontSize: 10,
						color: "var(--sf-fg-muted)",
						border: "1px solid var(--sf-border)",
						borderRadius: 3,
						padding: "1px 4px",
						fontFamily: "var(--sf-mono)",
					}}
				>
					⌘K
				</span>
			</div>

			{/* Nav */}
			<nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
				<div
					style={{
						fontSize: 10,
						fontWeight: 600,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: "var(--sf-fg-muted)",
						padding: "10px 10px 6px",
					}}
				>
					Pilotage
				</div>
				{navItems.map((item) => {
					const active = isActive(item.path);
					const itemStyle: React.CSSProperties = {
						display: "flex",
						alignItems: "center",
						gap: 10,
						padding: "8px 10px",
						borderRadius: 6,
						background: active ? "var(--sf-surface-2)" : "transparent",
						color: active ? "var(--sf-fg)" : "var(--sf-fg-soft)",
						fontSize: 13,
						fontWeight: active ? 500 : undefined,
						letterSpacing: "-0.005em",
						textDecoration: "none",
						width: "100%",
						textAlign: "left",
						border: "none",
						cursor: item.path ? "pointer" : "default",
						fontFamily: "var(--sf-sans)",
						opacity: item.path ? 1 : 0.5,
					};

					const content = (
						<>
							<span
								style={{
									color: active ? "var(--sf-fg)" : "var(--sf-fg-muted)",
									display: "flex",
									flexShrink: 0,
								}}
							>
								{item.icon}
							</span>
							<span style={{ flex: 1 }}>{item.label}</span>
							{item.count !== undefined && (
								<span
									style={{
										fontSize: 11,
										color: item.accent
											? "var(--sf-danger)"
											: "var(--sf-fg-muted)",
										background: item.accent
											? "var(--sf-danger-tint)"
											: "transparent",
										padding: item.accent ? "1px 6px" : "0",
										borderRadius: 999,
										fontVariantNumeric: "tabular-nums",
										fontWeight: 500,
									}}
								>
									{item.count}
								</span>
							)}
						</>
					);

					if (item.path) {
						return (
							<Link key={item.label} to={item.path} style={itemStyle}>
								{content}
							</Link>
						);
					}
					return (
						<button key={item.label} type="button" style={itemStyle} disabled>
							{content}
						</button>
					);
				})}
			</nav>

			<div style={{ flex: 1 }} />

			{/* Footer user card */}
			<div
				style={{
					marginTop: 24,
					padding: 10,
					border: "1px solid var(--sf-border)",
					borderRadius: 8,
					display: "flex",
					alignItems: "center",
					gap: 10,
					background: "var(--sf-surface)",
				}}
			>
				<span
					style={{
						width: 30,
						height: 30,
						borderRadius: "50%",
						background: "var(--sf-primary)",
						color: "white",
						fontSize: 11,
						fontWeight: 600,
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
					}}
				>
					ES
				</span>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						lineHeight: 1.25,
						flex: 1,
						minWidth: 0,
					}}
				>
					<span
						style={{ fontSize: 12.5, fontWeight: 500, color: "var(--sf-fg)" }}
					>
						Édouard S.
					</span>
					<span style={{ fontSize: 11, color: "var(--sf-fg-muted)" }}>
						Administrateur
					</span>
				</div>
				<button
					type="button"
					aria-label="Se déconnecter"
					onClick={async () => {
						await logoutFn();
						window.location.href = "/login";
					}}
					style={{
						border: "none",
						background: "transparent",
						cursor: "pointer",
						padding: 4,
						display: "inline-flex",
					}}
				>
					<LogOut size={14} color="var(--sf-fg-muted)" aria-hidden="true" />
				</button>
			</div>
		</aside>
	);
}
