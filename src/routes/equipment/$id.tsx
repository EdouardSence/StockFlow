import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { StatusBadge } from "../../components/StatusBadge";
import { getEquipmentById, updateEquipmentStatus } from "../../lib/equipment";

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

function EquipmentDetailPage() {
	const equipment = Route.useLoaderData();
	const navigate = useNavigate();
	const router = useRouter();
	const [updating, setUpdating] = useState(false);
	const [updateError, setUpdateError] = useState<string | null>(null);

	if (!equipment) {
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
						onClick={() => navigate({ to: "/equipment" })}
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
						Retour à la liste
					</button>
				</main>
			</div>
		);
	}

	async function handleStatusChange(
		status: "broken" | "available" | "maintenance" | "assigned",
	) {
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
								<button
									type="button"
									disabled={
										updating ||
										equipment.status === "broken"
									}
									aria-label="Déclarer cet équipement en panne — passe le statut à 'En panne'"
									onClick={() => handleStatusChange("broken")}
									style={{
										flex: 1,
										minWidth: 180,
										padding: "14px 20px",
										border: "1px solid oklch(0.75 0.12 25)",
										background:
											equipment.status === "broken"
												? "oklch(0.96 0.03 25)"
												: "var(--sf-bg)",
										borderRadius: 8,
										fontSize: 14,
										fontWeight: 500,
										color:
											equipment.status === "broken"
												? "oklch(0.40 0.14 25)"
												: "oklch(0.45 0.16 25)",
										cursor:
											updating || equipment.status === "broken"
												? "not-allowed"
												: "pointer",
										fontFamily: "inherit",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: 8,
										opacity:
											updating || equipment.status === "broken" ? 0.6 : 1,
										transition: "opacity 0.15s",
									}}
								>
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
									Déclarer en panne
								</button>

								<button
									type="button"
									disabled={
										updating ||
										equipment.status === "available"
									}
									aria-label="Marquer cet équipement disponible — passe le statut à 'Disponible'"
									onClick={() => handleStatusChange("available")}
									style={{
										flex: 1,
										minWidth: 180,
										padding: "14px 20px",
										border: "1px solid oklch(0.75 0.10 152)",
										background:
											equipment.status === "available"
												? "oklch(0.96 0.03 152)"
												: "var(--sf-bg)",
										borderRadius: 8,
										fontSize: 14,
										fontWeight: 500,
										color:
											equipment.status === "available"
												? "oklch(0.32 0.08 152)"
												: "oklch(0.38 0.14 152)",
										cursor:
											updating || equipment.status === "available"
												? "not-allowed"
												: "pointer",
										fontFamily: "inherit",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: 8,
										opacity:
											updating || equipment.status === "available" ? 0.6 : 1,
										transition: "opacity 0.15s",
									}}
								>
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
									Marquer disponible
								</button>
							</div>
							{updateError && (
								<p
									role="alert"
									style={{ fontSize: 13, color: "oklch(0.50 0.18 25)", margin: 0 }}
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
