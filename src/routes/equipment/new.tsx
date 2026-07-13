import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMobile } from "../../components/MobileLayout";
import { Sidebar } from "../../components/Sidebar";
import type { EquipmentTable } from "../../db/types";
import { createEquipmentFn } from "../../lib/equipment";

export const Route = createFileRoute("/equipment/new")({
	component: NewEquipmentPage,
});

function QRCodeImage({ url, size = 140 }: { url: string; size?: number }) {
	const [dataUrl, setDataUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!url) return;
		let active = true;
		import("qrcode").then((m) => {
			m.default
				.toDataURL(url, { width: size * 2, margin: 1 })
				.then((u: string) => {
					if (active) setDataUrl(u);
				});
		});
		return () => {
			active = false;
		};
	}, [url, size]);

	if (!dataUrl) {
		return (
			<div
				style={{
					width: size,
					height: size,
					background: "var(--sf-surface-2)",
					borderRadius: 4,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<span style={{ fontSize: 10, color: "var(--sf-fg-muted)" }}>…</span>
			</div>
		);
	}
	return (
		<img
			src={dataUrl}
			width={size}
			height={size}
			alt={`QR code — ${url}`}
			style={{ display: "block", imageRendering: "pixelated" }}
		/>
	);
}

const fieldStyle: React.CSSProperties = {
	width: "100%",
	padding: "9px 12px",
	border: "1px solid var(--sf-border)",
	borderRadius: 7,
	fontSize: 13.5,
	background: "var(--sf-bg)",
	color: "var(--sf-fg)",
	fontFamily: "inherit",
	letterSpacing: "-0.005em",
	boxShadow: "0 1px 0 rgba(0,0,0,.2)",
	boxSizing: "border-box",
};

const sectionStyle: React.CSSProperties = {
	background: "var(--sf-bg)",
	border: "1px solid var(--sf-border)",
	borderRadius: 10,
	padding: "20px 22px",
};

type Phase = "editing" | "submitting" | "created";

type Created = { id: string; qr_code: string };

interface FormFieldProps {
	label: string;
	/** id du contrôle associé — omis pour un groupe de contrôles (ex: boutons toggle) */
	htmlFor?: string;
	required?: boolean;
	hint?: string;
	children: React.ReactNode;
}

function FormField({
	label,
	htmlFor,
	required,
	hint,
	children,
}: FormFieldProps) {
	const labelStyle: React.CSSProperties = {
		fontSize: 12.5,
		fontWeight: 500,
		color: "var(--sf-fg)",
		letterSpacing: "-0.005em",
		display: "flex",
		alignItems: "center",
		gap: 4,
	};
	const labelContent = (
		<>
			{label}
			{required && <span style={{ color: "var(--sf-danger)" }}>*</span>}
			{hint && (
				<span
					style={{
						marginLeft: "auto",
						fontSize: 11,
						color: "var(--sf-fg-muted)",
						fontWeight: 400,
					}}
				>
					{hint}
				</span>
			)}
		</>
	);
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
			{htmlFor ? (
				<label htmlFor={htmlFor} style={labelStyle}>
					{labelContent}
				</label>
			) : (
				<span style={labelStyle}>{labelContent}</span>
			)}
			{children}
		</div>
	);
}

interface SectionHeaderProps {
	index: string;
	title: string;
	desc: string;
}

function SectionHeader({ index, title, desc }: SectionHeaderProps) {
	return (
		<div>
			<div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
				<span
					style={{
						fontSize: 10,
						fontWeight: 600,
						letterSpacing: "0.08em",
						color: "var(--sf-fg-muted)",
						textTransform: "uppercase",
					}}
				>
					{index}
				</span>
				<span
					style={{
						fontSize: 14,
						fontWeight: 600,
						color: "var(--sf-fg)",
						letterSpacing: "-0.01em",
					}}
				>
					{title}
				</span>
			</div>
			<p
				style={{
					margin: "3px 0 0",
					fontSize: 12.5,
					color: "var(--sf-fg-muted)",
				}}
			>
				{desc}
			</p>
		</div>
	);
}

const TYPES: { id: EquipmentTable["type"]; label: string }[] = [
	{ id: "pc", label: "Fixe" },
	{ id: "screen", label: "Écran" },
	{ id: "printer", label: "Imprimante" },
	{ id: "other", label: "Autre" },
];

function NewEquipmentPage() {
	const navigate = useNavigate();
	const isMobile = useMobile();
	const [form, setForm] = useState({
		name: "",
		type: "pc" as EquipmentTable["type"],
		brand: "",
		model: "",
		serial: "",
		location: "",
		notes: "",
	});
	const [phase, setPhase] = useState<Phase>("editing");
	const [created, setCreated] = useState<Created | null>(null);
	const [error, setError] = useState<string | null>(null);

	const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
	const valid = form.name.trim().length > 0;

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!valid) return;
		setPhase("submitting");
		setError(null);
		try {
			const result = await createEquipmentFn({
				data: {
					name: form.name.trim(),
					type: form.type,
					brand: form.brand || null,
					model: form.model || null,
					serial_number: form.serial || null,
					notes: form.notes || null,
				},
			});
			setCreated(result);
			setPhase("created");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur inconnue");
			setPhase("editing");
		}
	}

	return (
		<div
			style={{
				display: "flex",
				height: "100vh",
				background: "var(--sf-canvas)",
			}}
		>
			{!isMobile && <Sidebar />}
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
							<title>Retour</title>
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
							<title>Séparateur de fil d'ariane</title>
							<polyline points="9 18 15 12 9 6" />
						</svg>
						<span style={{ color: "var(--sf-fg)", fontWeight: 500 }}>
							Nouvel équipement
						</span>
					</div>
				</header>

				<div
					style={{
						flex: 1,
						overflow: "auto",
						padding: isMobile ? "18px 14px 48px" : "28px 28px 60px",
					}}
				>
					<div
						style={{
							maxWidth: 1080,
							margin: "0 auto",
							display: "grid",
							gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
							gap: isMobile ? 18 : 28,
						}}
					>
						{/* Left: form */}
						<form
							onSubmit={handleSubmit}
							style={{ display: "flex", flexDirection: "column", gap: 22 }}
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
									Ajouter un équipement
								</h1>
								<p
									style={{
										fontSize: 13.5,
										color: "var(--sf-fg-muted)",
										margin: "4px 0 0",
										letterSpacing: "-0.005em",
									}}
								>
									Un QR code unique sera généré automatiquement à
									l'enregistrement.
								</p>
							</div>

							{/* Section 01: Identification */}
							<section style={sectionStyle}>
								<SectionHeader
									index="01"
									title="Identification"
									desc="Le nom est le seul champ obligatoire."
								/>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr",
										gap: 16,
										marginTop: 18,
									}}
								>
									<FormField
										label="Nom de l'équipement"
										htmlFor="equipment-name"
										required
										hint="visible dans la liste"
									>
										<input
											id="equipment-name"
											style={fieldStyle}
											value={form.name}
											onChange={(e) => update("name", e.target.value)}
											placeholder='Ex : MacBook Pro 14" — Bureau 3.04'
										/>
									</FormField>
									<FormField label="Type d'équipement">
										<div
											role="radiogroup"
											aria-label="Type d'équipement"
											style={{
												display: "grid",
												gridTemplateColumns: isMobile
													? "repeat(2, 1fr)"
													: "repeat(6, 1fr)",
												gap: 8,
											}}
										>
											{TYPES.map((t) => {
												const sel = form.type === t.id;
												return (
													<label
														key={t.id}
														style={{
															display: "flex",
															flexDirection: "column",
															alignItems: "center",
															gap: 6,
															padding: "12px 4px",
															border: `1px solid ${sel ? "var(--sf-primary)" : "var(--sf-border)"}`,
															borderRadius: 7,
															background: sel
																? "var(--sf-primary-tint)"
																: "var(--sf-bg)",
															cursor: "pointer",
															fontFamily: "inherit",
															color: sel
																? "var(--sf-primary-soft)"
																: "var(--sf-fg-soft)",
															fontSize: 12,
															fontWeight: sel ? 500 : 400,
															boxShadow: sel
																? "0 0 0 3px rgba(99,102,241,.15)"
																: "none",
														}}
													>
														<input
															type="radio"
															name="equipment-type"
															value={t.id}
															checked={sel}
															onChange={() => update("type", t.id)}
															style={{ margin: 0 }}
														/>
														{t.label}
													</label>
												);
											})}
										</div>
									</FormField>
								</div>
							</section>

							{/* Section 02: Caractéristiques */}
							<section style={sectionStyle}>
								<SectionHeader
									index="02"
									title="Caractéristiques"
									desc="Optionnel — utile pour la garantie & le SAV."
								/>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
										gap: 14,
										marginTop: 18,
									}}
								>
									<FormField label="Marque" htmlFor="equipment-brand">
										<input
											id="equipment-brand"
											style={fieldStyle}
											value={form.brand}
											onChange={(e) => update("brand", e.target.value)}
											placeholder="Apple, Dell, HP…"
										/>
									</FormField>
									<FormField label="Modèle" htmlFor="equipment-model">
										<input
											id="equipment-model"
											style={fieldStyle}
											value={form.model}
											onChange={(e) => update("model", e.target.value)}
											placeholder="MacBook Pro 14 (2023)"
										/>
									</FormField>
									<FormField
										label="Numéro de série"
										htmlFor="equipment-serial"
										hint="unique"
									>
										<input
											id="equipment-serial"
											style={{
												...fieldStyle,
												fontFamily: "var(--sf-mono)",
												fontSize: 13,
											}}
											value={form.serial}
											onChange={(e) => update("serial", e.target.value)}
											placeholder="C02XK1234ABC"
										/>
									</FormField>
									<FormField label="Localisation" htmlFor="equipment-location">
										<input
											id="equipment-location"
											style={fieldStyle}
											value={form.location}
											onChange={(e) => update("location", e.target.value)}
											placeholder="Bureau, salle, site"
										/>
									</FormField>
								</div>
							</section>

							{/* Section 03: Notes */}
							<section style={sectionStyle}>
								<SectionHeader
									index="03"
									title="Notes internes"
									desc="Laissez vide si rien à signaler."
								/>
								<div style={{ marginTop: 18 }}>
									<textarea
										style={{
											...fieldStyle,
											minHeight: 76,
											resize: "vertical",
											lineHeight: 1.5,
										}}
										value={form.notes}
										onChange={(e) => update("notes", e.target.value)}
										placeholder="Date d'achat, garantie, particularités…"
									/>
								</div>
							</section>

							{error && (
								<p
									style={{
										fontSize: 13,
										color: "var(--sf-danger)",
										margin: 0,
									}}
								>
									{error}
								</p>
							)}

							{/* Footer */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 10,
									padding: "14px 0 0",
									borderTop: "1px solid var(--sf-border)",
								}}
							>
								<span style={{ fontSize: 12, color: "var(--sf-fg-muted)" }}>
									{valid
										? "Prêt à enregistrer."
										: "Renseignez le nom pour continuer."}
								</span>
								<div style={{ flex: 1 }} />
								<button
									type="button"
									onClick={() => navigate({ to: "/equipment" })}
									style={{
										padding: "8px 14px",
										border: "1px solid var(--sf-border)",
										background: "var(--sf-bg)",
										borderRadius: 7,
										fontSize: 13,
										color: "var(--sf-fg-soft)",
										cursor: "pointer",
										fontFamily: "inherit",
									}}
								>
									Annuler
								</button>
								<button
									type="submit"
									disabled={!valid || phase === "submitting"}
									style={{
										padding: "8px 16px",
										border: "1px solid var(--sf-primary-strong)",
										background:
											"linear-gradient(135deg, var(--sf-primary), var(--sf-primary-strong))",
										color: "white",
										borderRadius: 7,
										fontSize: 13,
										fontWeight: 500,
										cursor: valid ? "pointer" : "not-allowed",
										fontFamily: "inherit",
										opacity: valid ? 1 : 0.5,
										boxShadow:
											"0 4px 16px rgba(99,102,241,.3), inset 0 1px 0 rgba(255,255,255,.15)",
										display: "inline-flex",
										alignItems: "center",
										gap: 6,
									}}
								>
									{phase === "submitting"
										? "Enregistrement…"
										: "Enregistrer & générer QR"}
								</button>
							</div>
						</form>

						{/* Right: QR preview */}
						<aside
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 14,
								position: "sticky",
								top: 0,
								alignSelf: "start",
							}}
						>
							<div style={{ ...sectionStyle, padding: 18 }}>
								<div
									style={{
										fontSize: 11,
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "var(--sf-fg-muted)",
									}}
								>
									Aperçu — étiquette
								</div>
								<div
									style={{
										marginTop: 14,
										border: "1px dashed var(--sf-border)",
										borderRadius: 8,
										padding: 16,
										background: "var(--sf-surface)",
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										gap: 10,
									}}
								>
									<div
										style={{
											background: "white",
											padding: 8,
											borderRadius: 6,
											border: "1px solid var(--sf-border)",
										}}
									>
										{phase === "created" && created ? (
											<QRCodeImage
												url={`${typeof window !== "undefined" ? window.location.origin : ""}/equipment/${created.id}`}
												size={140}
											/>
										) : (
											<div
												style={{
													width: 140,
													height: 140,
													background: "var(--sf-surface-2)",
													borderRadius: 4,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<span
													style={{
														fontSize: 11,
														color: "var(--sf-fg-muted)",
														textAlign: "center",
														padding: "0 12px",
														lineHeight: 1.4,
													}}
												>
													QR généré après enregistrement
												</span>
											</div>
										)}
									</div>
									<div style={{ textAlign: "center", lineHeight: 1.35 }}>
										<div
											style={{
												fontSize: 12.5,
												fontWeight: 500,
												color: "var(--sf-fg)",
											}}
										>
											{form.name || "Nom de l'équipement"}
										</div>
										<div
											style={{
												fontSize: 11,
												fontFamily: "var(--sf-mono)",
												color: "var(--sf-fg-muted)",
												marginTop: 2,
											}}
										>
											{created?.id ?? "EQ-XXXX"} ·{" "}
											{created?.qr_code.slice(0, 8) ?? "SF-XXXX"}
										</div>
									</div>
								</div>
								<div
									style={{
										fontSize: 11.5,
										color: "var(--sf-fg-muted)",
										marginTop: 12,
										lineHeight: 1.5,
									}}
								>
									L'étiquette est générée puis imprimable au format 50×30 mm.
								</div>
							</div>

							{phase === "created" && created && (
								<div
									style={{
										background: "var(--sf-success-tint)",
										border: "1px solid var(--sf-success-border)",
										borderRadius: 10,
										padding: 14,
										display: "flex",
										flexDirection: "column",
										gap: 10,
									}}
								>
									<div
										style={{ display: "flex", alignItems: "center", gap: 8 }}
									>
										<span
											style={{
												width: 22,
												height: 22,
												borderRadius: "50%",
												background: "var(--sf-success-dot)",
												display: "inline-flex",
												alignItems: "center",
												justifyContent: "center",
												color: "white",
												fontSize: 13,
												fontWeight: 700,
											}}
										>
											✓
										</span>
										<span
											style={{
												fontSize: 13.5,
												fontWeight: 600,
												color: "var(--sf-success)",
												letterSpacing: "-0.005em",
											}}
										>
											Équipement enregistré
										</span>
									</div>
									<div
										style={{
											fontSize: 12.5,
											color: "var(--sf-success)",
											lineHeight: 1.5,
										}}
									>
										ID{" "}
										<span
											style={{ fontFamily: "var(--sf-mono)", fontWeight: 500 }}
										>
											{created.id.slice(0, 8)}
										</span>
										{" · "}QR{" "}
										<span
											style={{ fontFamily: "var(--sf-mono)", fontWeight: 500 }}
										>
											{created.qr_code.slice(0, 8)}
										</span>
									</div>
									<button
										type="button"
										onClick={() => navigate({ to: "/equipment" })}
										style={{
											padding: "7px 12px",
											border: "1px solid var(--sf-success-border)",
											background: "var(--sf-success-dot)",
											color: "white",
											borderRadius: 6,
											fontSize: 12.5,
											fontWeight: 500,
											cursor: "pointer",
											fontFamily: "inherit",
											display: "inline-flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 6,
										}}
									>
										Voir dans la liste
									</button>
								</div>
							)}
						</aside>
					</div>
				</div>
			</main>
		</div>
	);
}
