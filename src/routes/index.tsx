import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MobileBottomNav, StockFlowLogo, TypeIcon } from "../components/MobileLayout";
import { StatusBadge } from "../components/StatusBadge";
import { getEquipments } from "../lib/equipment";

export const Route = createFileRoute("/")({
	loader: () => getEquipments(),
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
	const equipment = Route.useLoaderData();

	if (!isMobile) {
		return <Navigate to="/equipment" />;
	}

	return <MobileHome equipment={equipment} />;
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
							background: "oklch(0.20 0.02 255)",
							color: "white",
							border: "1px solid oklch(0.20 0.02 255)",
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
							<span style={{ fontSize: 12, color: "oklch(0.75 0.02 255)" }}>
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
						<span style={{ ...tileIconBase, background: "oklch(0.96 0.025 255)" }}>
							<PlusIcon size={20} stroke="oklch(0.40 0.14 255)" />
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
					<span style={{ ...tileIconBase, background: "oklch(0.97 0.03 25)" }}>
						<AlertIcon size={20} stroke="oklch(0.50 0.18 25)" />
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
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
			<path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
			<path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
			<line x1="7" y1="12" x2="17" y2="12" />
		</svg>
	);
}

function PlusIcon({ size = 20, stroke = "currentColor" }: { size?: number; stroke?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
			<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);
}

function AlertIcon({ size = 20, stroke = "currentColor" }: { size?: number; stroke?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
			<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
			<line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
	);
}

function ChevronRightIcon({ size = 16, stroke = "currentColor" }: { size?: number; stroke?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
			<polyline points="9 18 15 12 9 6" />
		</svg>
	);
}

/* ── Style constants ────────────────────────────────────────────── */

const darkTileIcon: React.CSSProperties = {
	width: 40,
	height: 40,
	borderRadius: 10,
	background: "oklch(1 0 0 / 0.10)",
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
