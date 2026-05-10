import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { MobileBottomNav, TypeIcon } from "../../components/MobileLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { getEquipmentById, updateEquipmentStatus } from "../../lib/equipment";
import type { EquipmentTable } from "../../db/types";

export const Route = createFileRoute("/equipment/$id")({
	loader: ({ params }) => getEquipmentById({ data: { id: params.id } }),
	component: EquipmentDetailPage,
});

const TYPE_LABELS: Record<string, string> = {
	pc: "Fixe",
	laptop: "Portable",
	screen: "Écran",
	printer: "Imprimante",
	phone: "Téléphone",
	other: "Autre",
};

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

function EquipmentDetailPage() {
	const equipment = Route.useLoaderData();
	const navigate = useNavigate();
	const router = useRouter();
	const isMobile = useMobile();
	const [updating, setUpdating] = useState(false);
	const [updateError, setUpdateError] = useState<string | null>(null);
	const [actionTaken, setActionTaken] = useState<string | null>(null);

	if (!equipment) {
		return (
			<div style={{ display: "flex", height: "100vh", background: "var(--sf-canvas)" }}>
				{!isMobile && <Sidebar />}
				<main
					style={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexDirection: "column",
						gap: 12,
					}}
				>
					<p style={{ fontSize: 15, color: "var(--sf-fg-muted)" }}>
						Équipement introuvable.
					</p>
					<button
						type="button"
						onClick={() =>
							navigate({ to: isMobile ? "/" : "/equipment" })
						}
						style={{
							padding: "8px 16px",
							border: "1px solid var(--sf-border)",
							background: "var(--sf-bg)",
							borderRadius: 7,
							fontSize: 13,
							color: "var(--sf-fg)",
							cursor: "pointer",
							fontFamily: "inherit",
						}}
					>
						{isMobile ? "Accueil" : "Retour à la liste"}
					</button>
				</main>
			</div>
		);
	}

	async function handleStatusChange(status: EquipmentTable["status"]) {
		setUpdating(true);
		setUpdateError(null);
		try {
			await updateEquipmentStatus({ data: { id: equipment!.id, status } });
			await router.invalidate();
		} catch (err) {
			setUpdateError(err instanceof Error ? err.message : "Erreur inconnue");
		} finally {
			setUpdating(false);
		}
	}

	async function handleMobileAction(label: string, status: EquipmentTable["status"]) {
		setActionTaken(label);
		await handleStatusChange(status);
	}

	if (isMobile) {
		return (
			<MobileEquipmentDetail
				equipment={equipment}
				updating={updating}
				updateError={updateError}
				actionTaken={actionTaken}
				onStatusChange={handleMobileAction}
				onBack={() => navigate({ to: "/" })}
			/>
		);
	}

	return <DesktopEquipmentDetail equipment={equipment} updating={updating} updateError={updateError} onStatusChange={handleStatusChange} />;
}

/* ── Mobile detail view ─────────────────────────────────────────── */

function MobileEquipmentDetail({
	equipment,
	updating,
	updateError,
	actionTaken,
	onStatusChange,
	onBack,
}: {
	equipment: EquipmentTable;
	updating: boolean;
	updateError: string | null;
	actionTaken: string | null;
	onStatusChange: (label: string, status: EquipmentTable["status"]) => void;
	onBack: () => void;
}) {
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "var(--sf-canvas)",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				fontFamily: "var(--sf-sans)",
			}}
		>
			{/* Header */}
			<header
				style={{
					display: "flex",
					alignItems: "center",
					padding: "14px 14px 10px",
					gap: 8,
					background: "var(--sf-bg)",
					borderBottom: "1px solid var(--sf-border)",
					flexShrink: 0,
				}}
			>
				<button
					type="button"
					onClick={onBack}
					style={{
						width: 34,
						height: 34,
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						border: "1px solid var(--sf-border)",
						borderRadius: 8,
						background: "var(--sf-bg)",
						cursor: "pointer",
					}}
				>
					<svg
						width={15}
						height={15}
						viewBox="0 0 24 24"
						fill="none"
						stroke="var(--sf-fg)"
						strokeWidth={1.8}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="19" y1="12" x2="5" y2="12" />
						<polyline points="12 19 5 12 12 5" />
					</svg>
				</button>
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						lineHeight: 1.2,
					}}
				>
					<span
						style={{
							fontSize: 11,
							color: "var(--sf-fg-muted)",
							letterSpacing: "0.04em",
							fontFamily: "var(--sf-mono)",
						}}
					>
						{equipment.qr_code.slice(0, 16)}
					</span>
					<span
						style={{
							fontSize: 14,
							fontWeight: 600,
							color: "var(--sf-fg)",
							letterSpacing: "-0.01em",
						}}
					>
						Équipement scanné
					</span>
				</div>
			</header>

			<div style={{ flex: 1, overflow: "auto" }}>
				{/* Hero */}
				<section
					style={{
						padding: "20px 18px 16px",
						background: "var(--sf-bg)",
					}}
				>
					<div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
						<div
							style={{
								width: 56,
								height: 56,
								borderRadius: 12,
								background: "var(--sf-surface)",
								border: "1px solid var(--sf-border)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "var(--sf-fg)",
								flexShrink: 0,
							}}
						>
							<TypeIcon type={equipment.type} size={26} />
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div
								style={{
									fontSize: 17,
									fontWeight: 600,
									color: "var(--sf-fg)",
									letterSpacing: "-0.015em",
									lineHeight: 1.25,
								}}
							>
								{equipment.name}
							</div>
							<div
								style={{
									fontSize: 12.5,
									color: "var(--sf-fg-muted)",
									marginTop: 4,
									fontFamily: "var(--sf-mono)",
								}}
							>
								{equipment.id.slice(0, 8)} · {equipment.serial_number || "—"}
							</div>
							<div style={{ marginTop: 10 }}>
								<StatusBadge status={equipment.status} size="md" />
							</div>
						</div>
					</div>
				</section>

				{/* Info rows */}
				<section
					style={{
						margin: "12px 14px",
						background: "var(--sf-bg)",
						border: "1px solid var(--sf-border)",
						borderRadius: 12,
						overflow: "hidden",
					}}
				>
					<InfoRow label="Type" value={TYPE_LABELS[equipment.type] ?? equipment.type} />
					{equipment.brand && (
						<InfoRow label="Marque" value={equipment.brand} />
					)}
					{equipment.model && (
						<InfoRow label="Modèle" value={equipment.model} />
					)}
					<InfoRow
						label="Attribué à"
						value={equipment.assigned_to ?? "Aucun · en stock"}
						last
					/>
				</section>

				{/* Incident banner if broken */}
				{equipment.status === "broken" && (
					<section
						style={{
							margin: "0 14px 12px",
							padding: "12px 14px",
							background: "oklch(0.97 0.03 25)",
							border: "1px solid oklch(0.86 0.06 25)",
							borderRadius: 12,
							display: "flex",
							gap: 10,
							alignItems: "flex-start",
						}}
					>
						<svg
							width={16}
							height={16}
							viewBox="0 0 24 24"
							fill="none"
							stroke="oklch(0.50 0.18 25)"
							strokeWidth={1.6}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
						<div>
							<div
								style={{
									fontSize: 12,
									fontWeight: 600,
									color: "oklch(0.40 0.16 25)",
									letterSpacing: "-0.005em",
								}}
							>
								Incident en cours
							</div>
							{equipment.notes && (
								<div
									style={{
										fontSize: 12.5,
										color: "oklch(0.35 0.10 25)",
										marginTop: 2,
									}}
								>
									{equipment.notes}
								</div>
							)}
						</div>
					</section>
				)}

				{/* Quick actions */}
				<div
					style={{
						padding: "4px 18px 8px",
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: "var(--sf-fg-muted)",
					}}
				>
					Actions rapides
				</div>
				<section
					style={{
						margin: "0 14px 18px",
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 8,
					}}
				>
					<ActionTile
						icon="user"
						label="Attribuer"
						active={actionTaken === "Attribué" || equipment.status === "assigned"}
						disabled={updating}
						onClick={() => onStatusChange("Attribué", "assigned")}
					/>
					<ActionTile
						icon="alert"
						label="Signaler panne"
						tone="warn"
						active={actionTaken === "Panne signalée" || equipment.status === "broken"}
						disabled={updating}
						onClick={() => onStatusChange("Panne signalée", "broken")}
					/>
					<ActionTile
						icon="wrench"
						label="Maintenance"
						active={actionTaken === "En maintenance" || equipment.status === "maintenance"}
						disabled={updating}
						onClick={() => onStatusChange("En maintenance", "maintenance")}
					/>
					<ActionTile
						icon="check"
						label="Remettre dispo"
						tone="ok"
						active={actionTaken === "Remis en stock" || equipment.status === "available"}
						disabled={updating}
						onClick={() => onStatusChange("Remis en stock", "available")}
					/>
				</section>

				{/* Success confirmation */}
				{actionTaken && (
					<div
						style={{
							margin: "0 14px 16px",
							padding: "10px 12px",
							background: "oklch(0.97 0.04 152)",
							border: "1px solid oklch(0.85 0.08 152)",
							borderRadius: 10,
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<span
							style={{
								width: 18,
								height: 18,
								borderRadius: "50%",
								background: "oklch(0.62 0.15 152)",
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<svg
								width={11}
								height={11}
								viewBox="0 0 24 24"
								fill="none"
								stroke="white"
								strokeWidth={2.5}
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
						</span>
						<span
							style={{
								fontSize: 12.5,
								color: "oklch(0.30 0.10 152)",
								fontWeight: 500,
							}}
						>
							{actionTaken} · synchronisé
						</span>
					</div>
				)}

				{updateError && (
					<p
						role="alert"
						style={{
							margin: "0 14px 14px",
							fontSize: 13,
							color: "oklch(0.50 0.18 25)",
						}}
					>
						{updateError}
					</p>
				)}

				<div style={{ height: 8 }} />
			</div>

			<MobileBottomNav active="stock" />
		</div>
	);
}

function InfoRow({
	label,
	value,
	last,
}: { label: string; value: string; last?: boolean }) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "12px 14px",
				borderBottom: last ? "none" : "1px solid var(--sf-border-soft)",
				gap: 12,
			}}
		>
			<span style={{ fontSize: 12.5, color: "var(--sf-fg-muted)", flexShrink: 0 }}>
				{label}
			</span>
			<span
				style={{
					fontSize: 13,
					color: "var(--sf-fg)",
					fontWeight: 500,
					textAlign: "right",
					maxWidth: "60%",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
			>
				{value}
			</span>
		</div>
	);
}

function ActionTile({
	icon,
	label,
	tone,
	active,
	disabled,
	onClick,
}: {
	icon: "user" | "alert" | "wrench" | "check";
	label: string;
	tone?: "warn" | "ok";
	active?: boolean;
	disabled?: boolean;
	onClick: () => void;
}) {
	const toneStyle =
		tone === "warn"
			? {
					bg: "oklch(0.97 0.03 25)",
					border: "oklch(0.86 0.06 25)",
					fg: "oklch(0.45 0.16 25)",
				}
			: tone === "ok"
				? {
						bg: "oklch(0.97 0.04 152)",
						border: "oklch(0.85 0.08 152)",
						fg: "oklch(0.38 0.12 152)",
					}
				: {
						bg: "var(--sf-bg)",
						border: "var(--sf-border)",
						fg: "var(--sf-fg)",
					};

	const iconStroke = active ? "white" : toneStyle.fg;

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				gap: 8,
				padding: 14,
				background: active ? "oklch(0.55 0.16 255)" : toneStyle.bg,
				border: `1px solid ${active ? "oklch(0.45 0.14 255)" : toneStyle.border}`,
				borderRadius: 12,
				cursor: disabled ? "not-allowed" : "pointer",
				fontFamily: "inherit",
				color: active ? "white" : toneStyle.fg,
				textAlign: "left",
				opacity: disabled ? 0.7 : 1,
				transition: "opacity 0.15s",
			}}
		>
			<ActionIcon name={icon} stroke={iconStroke} />
			<span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "-0.005em" }}>
				{label}
			</span>
		</button>
	);
}

function ActionIcon({
	name,
	stroke = "currentColor",
}: { name: "user" | "alert" | "wrench" | "check"; stroke?: string }) {
	const s = {
		width: 18,
		height: 18,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke,
		strokeWidth: 1.6,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};
	switch (name) {
		case "user":
			return (
				<svg {...s}>
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			);
		case "alert":
			return (
				<svg {...s}>
					<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
			);
		case "wrench":
			return (
				<svg {...s}>
					<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
				</svg>
			);
		case "check":
			return (
				<svg {...s}>
					<polyline points="20 6 9 17 4 12" />
				</svg>
			);
	}
}

/* ── Desktop view (unchanged) ───────────────────────────────────── */

function DesktopEquipmentDetail({
	equipment,
	updating,
	updateError,
	onStatusChange,
}: {
	equipment: EquipmentTable;
	updating: boolean;
	updateError: string | null;
	onStatusChange: (status: EquipmentTable["status"]) => void;
}) {
	const navigate = useNavigate();

	const rowStyle: React.CSSProperties = {
		display: "flex",
		gap: 8,
		padding: "10px 0",
		borderBottom: "1px solid var(--sf-border)",
		alignItems: "flex-start",
	};

	const labelStyle: React.CSSProperties = {
		fontSize: 12.5,
		color: "var(--sf-fg-muted)",
		fontWeight: 500,
		width: 140,
		flexShrink: 0,
		paddingTop: 1,
	};

	const valueStyle: React.CSSProperties = {
		fontSize: 13.5,
		color: "var(--sf-fg)",
		flex: 1,
	};

	return (
		<div style={{ display: "flex", height: "100vh", background: "var(--sf-canvas)" }}>
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
						padding: "14px 28px",
						borderBottom: "1px solid var(--sf-border)",
						gap: 10,
						background: "var(--sf-bg)",
					}}
				>
					<button
						type="button"
						aria-label="Retour à la liste des équipements"
						onClick={() => navigate({ to: "/equipment" })}
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
							padding: "5px 10px 5px 7px",
							border: "1px solid var(--sf-border)",
							background: "var(--sf-bg)",
							borderRadius: 6,
							fontSize: 12.5,
							color: "var(--sf-fg-soft)",
							cursor: "pointer",
							fontFamily: "inherit",
						}}
					>
						<svg
							width={13}
							height={13}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.8}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<line x1="19" y1="12" x2="5" y2="12" />
							<polyline points="12 19 5 12 12 5" />
						</svg>
						Retour
					</button>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
							fontSize: 13,
							color: "var(--sf-fg-muted)",
						}}
					>
						<span>Équipements</span>
						<svg
							width={12}
							height={12}
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--sf-fg-muted)"
							strokeWidth={1.6}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<polyline points="9 18 15 12 9 6" />
						</svg>
						<span style={{ color: "var(--sf-fg)", fontWeight: 500 }}>
							{equipment.name}
						</span>
					</div>
				</header>

				<div style={{ flex: 1, overflow: "auto", padding: "28px 28px 60px" }}>
					<div
						style={{
							maxWidth: 860,
							margin: "0 auto",
							display: "flex",
							flexDirection: "column",
							gap: 24,
						}}
					>
						{/* Header */}
						<div
							style={{
								display: "flex",
								alignItems: "flex-start",
								justifyContent: "space-between",
								gap: 16,
							}}
						>
							<div>
								<h1
									style={{
										fontSize: 22,
										fontWeight: 600,
										letterSpacing: "-0.02em",
										margin: 0,
										color: "var(--sf-fg)",
									}}
								>
									{equipment.name}
								</h1>
								<p
									style={{
										fontSize: 13,
										color: "var(--sf-fg-muted)",
										margin: "4px 0 0",
										fontFamily: "var(--sf-mono)",
									}}
								>
									{equipment.id}
								</p>
							</div>
							<StatusBadge status={equipment.status} />
						</div>

						{/* Actions */}
						<section
							aria-label="Actions sur l'état du matériel"
							style={{
								background: "var(--sf-bg)",
								border: "1px solid var(--sf-border)",
								borderRadius: 10,
								padding: "20px 22px",
								display: "flex",
								flexDirection: "column",
								gap: 14,
							}}
						>
							<div
								style={{
									fontSize: 11,
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "var(--sf-fg-muted)",
								}}
							>
								Changer le statut
							</div>
							<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
								{[
									{
										status: "broken" as const,
										label: "Déclarer en panne",
										border: "oklch(0.75 0.12 25)",
										activeBg: "oklch(0.96 0.03 25)",
										color: "oklch(0.45 0.16 25)",
										activeColor: "oklch(0.40 0.14 25)",
										icon: (
											<svg
												width={16}
												height={16}
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
										),
									},
									{
										status: "available" as const,
										label: "Marquer disponible",
										border: "oklch(0.75 0.10 152)",
										activeBg: "oklch(0.96 0.03 152)",
										color: "oklch(0.38 0.14 152)",
										activeColor: "oklch(0.32 0.08 152)",
										icon: (
											<svg
												width={16}
												height={16}
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth={2}
												strokeLinecap="round"
												strokeLinejoin="round"
												aria-hidden="true"
											>
												<polyline points="20 6 9 17 4 12" />
											</svg>
										),
									},
								].map((btn) => (
									<button
										key={btn.status}
										type="button"
										disabled={updating || equipment.status === btn.status}
										onClick={() => onStatusChange(btn.status)}
										style={{
											flex: 1,
											minWidth: 180,
											padding: "14px 20px",
											border: `1px solid ${btn.border}`,
											background:
												equipment.status === btn.status ? btn.activeBg : "var(--sf-bg)",
											borderRadius: 8,
											fontSize: 14,
											fontWeight: 500,
											color:
												equipment.status === btn.status ? btn.activeColor : btn.color,
											cursor:
												updating || equipment.status === btn.status
													? "not-allowed"
													: "pointer",
											fontFamily: "inherit",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 8,
											opacity: updating || equipment.status === btn.status ? 0.6 : 1,
											transition: "opacity 0.15s",
										}}
									>
										{btn.icon}
										{btn.label}
									</button>
								))}
							</div>
							{updateError && (
								<p
									role="alert"
									style={{
										fontSize: 13,
										color: "oklch(0.50 0.18 25)",
										margin: 0,
									}}
								>
									{updateError}
								</p>
							)}
						</section>

						{/* Details */}
						<section
							aria-label="Informations de l'équipement"
							style={{
								background: "var(--sf-bg)",
								border: "1px solid var(--sf-border)",
								borderRadius: 10,
								padding: "20px 22px",
							}}
						>
							<div
								style={{
									fontSize: 11,
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "var(--sf-fg-muted)",
									marginBottom: 14,
								}}
							>
								Informations
							</div>
							<dl style={{ margin: 0 }}>
								<div style={rowStyle}>
									<dt style={labelStyle}>Type</dt>
									<dd style={{ ...valueStyle, margin: 0 }}>
										{TYPE_LABELS[equipment.type] ?? equipment.type}
									</dd>
								</div>
								{equipment.brand && (
									<div style={rowStyle}>
										<dt style={labelStyle}>Marque</dt>
										<dd style={{ ...valueStyle, margin: 0 }}>{equipment.brand}</dd>
									</div>
								)}
								{equipment.model && (
									<div style={rowStyle}>
										<dt style={labelStyle}>Modèle</dt>
										<dd style={{ ...valueStyle, margin: 0 }}>{equipment.model}</dd>
									</div>
								)}
								{equipment.serial_number && (
									<div style={rowStyle}>
										<dt style={labelStyle}>N° de série</dt>
										<dd
											style={{
												...valueStyle,
												margin: 0,
												fontFamily: "var(--sf-mono)",
												fontSize: 13,
											}}
										>
											{equipment.serial_number}
										</dd>
									</div>
								)}
								{equipment.notes && (
									<div style={{ ...rowStyle, borderBottom: "none" }}>
										<dt style={labelStyle}>Notes</dt>
										<dd
											style={{
												...valueStyle,
												margin: 0,
												whiteSpace: "pre-wrap",
												lineHeight: 1.5,
											}}
										>
											{equipment.notes}
										</dd>
									</div>
								)}
							</dl>
						</section>
					</div>
				</div>
			</main>
		</div>
	);
}
