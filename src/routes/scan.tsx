import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/scan")({
	component: ScanPage,
});

const READER_ID = "stockflow-qr-reader";

function beep() {
	try {
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.frequency.value = 880;
		gain.gain.setValueAtTime(0.3, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + 0.18);
	} catch {}
}

function ScanPage() {
	const navigate = useNavigate();
	const [scanKey, setScanKey] = useState(0);
	const [rawResult, setRawResult] = useState<string | null>(null);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function startScanner() {
			try {
				const { Html5Qrcode } = await import("html5-qrcode");
				if (cancelled) return;

				const scanner = new Html5Qrcode(READER_ID);
				scannerRef.current = scanner;

				await scanner.start(
					{ facingMode: "environment" },
					{ fps: 10, qrbox: { width: 220, height: 220 } },
					(decodedText: string) => {
						if (cancelled) return;
						scanner
							.stop()
							.then(() => scanner.clear())
							.catch(() => {});
						scannerRef.current = null;
						beep();

						const match = decodedText.match(/\/equipment\/([0-9a-f-]{36})/i);
						if (match) {
							navigate({ to: "/equipment/$id", params: { id: match[1] } });
						} else {
							setRawResult(decodedText);
						}
					},
					() => {},
				);
			} catch {
				if (!cancelled) {
					setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
				}
			}
		}

		startScanner();

		return () => {
			cancelled = true;
			const scanner = scannerRef.current;
			if (scanner) {
				scanner
					.stop()
					.then(() => scanner.clear())
					.catch(() => {});
				scannerRef.current = null;
			}
		};
	}, [scanKey, navigate]);

	function handleRescan() {
		setCameraError(null);
		setRawResult(null);
		setScanKey((k) => k + 1);
	}

	if (rawResult) {
		return <RawResultScreen result={rawResult} onRescan={handleRescan} />;
	}

	return <ScannerScreen cameraError={cameraError} onRescan={handleRescan} />;
}

/* ── Scanner view ───────────────────────────────────────────────── */

function ScannerScreen({
	cameraError,
	onRescan,
}: { cameraError: string | null; onRescan: () => void }) {
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "#0a0a0c",
				color: "white",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				fontFamily: "var(--sf-sans)",
			}}
		>
			{/* Animated scan line keyframes */}
			<style>{`
        @keyframes sf-scan {
          0%, 100% { transform: translateY(8px); opacity: 0.4; }
          50% { transform: translateY(212px); opacity: 1; }
        }
        #${READER_ID} video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
        #${READER_ID} img { display: none !important; }
        #${READER_ID} { border: none !important; padding: 0 !important; }
        #${READER_ID} > div:last-child { display: none !important; }
      `}</style>

			{/* Fake camera gradient background */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse at 50% 35%, oklch(0.30 0.04 250) 0%, oklch(0.12 0.02 255) 60%, #07070a 100%)",
				}}
			/>
			{/* Subtle grid */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundImage:
						"linear-gradient(oklch(1 0 0 / 0.03) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.03) 1px, transparent 1px)",
					backgroundSize: "24px 24px",
				}}
			/>

			{/* Camera feed (hidden behind overlay when no error) */}
			{!cameraError && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<div
						id={READER_ID}
						style={{
							width: 300,
							height: 300,
							overflow: "hidden",
							borderRadius: 0,
						}}
					/>
				</div>
			)}

			{/* Top bar */}
			<header
				style={{
					position: "relative",
					zIndex: 2,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "14px 18px",
					color: "white",
				}}
			>
				<Link to="/" style={{ textDecoration: "none" }}>
					<button type="button" style={mobIconBtn}>
						<XIcon />
					</button>
				</Link>
				<div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>
					Scanner
				</div>
				<div style={{ width: 36 }} />
			</header>

			{/* Scan frame overlay */}
			<div
				style={{
					position: "relative",
					zIndex: 2,
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					pointerEvents: "none",
				}}
			>
				{cameraError ? (
					<div
						role="alert"
						style={{
							background: "oklch(0.15 0.04 25 / 0.9)",
							border: "1px solid oklch(0.50 0.12 25 / 0.6)",
							borderRadius: 14,
							padding: "18px 22px",
							fontSize: 14,
							color: "oklch(0.85 0.06 25)",
							maxWidth: 320,
							textAlign: "center",
							backdropFilter: "blur(8px)",
							lineHeight: 1.5,
							pointerEvents: "auto",
						}}
					>
						<div style={{ marginBottom: 14 }}>{cameraError}</div>
						<button
							type="button"
							onClick={onRescan}
							style={{
								padding: "10px 20px",
								background: "oklch(0.55 0.16 255)",
								border: "none",
								borderRadius: 8,
								color: "white",
								fontSize: 13,
								fontWeight: 500,
								cursor: "pointer",
								fontFamily: "inherit",
							}}
						>
							Réessayer
						</button>
					</div>
				) : (
					<div style={{ position: "relative", width: 240, height: 240 }}>
						{/* Corner brackets */}
						{(["tl", "tr", "bl", "br"] as const).map((c) => (
							<span
								key={c}
								style={{
									position: "absolute",
									width: 28,
									height: 28,
									borderColor: "oklch(0.78 0.18 230)",
									borderStyle: "solid",
									borderWidth: 0,
									borderTopWidth: c[0] === "t" ? 3 : 0,
									borderBottomWidth: c[0] === "b" ? 3 : 0,
									borderLeftWidth: c[1] === "l" ? 3 : 0,
									borderRightWidth: c[1] === "r" ? 3 : 0,
									top: c[0] === "t" ? 0 : "auto",
									bottom: c[0] === "b" ? 0 : "auto",
									left: c[1] === "l" ? 0 : "auto",
									right: c[1] === "r" ? 0 : "auto",
									borderRadius:
										c === "tl"
											? "8px 0 0 0"
											: c === "tr"
												? "0 8px 0 0"
												: c === "bl"
													? "0 0 0 8px"
													: "0 0 8px 0",
									boxShadow: "0 0 12px oklch(0.78 0.18 230 / 0.4)",
								}}
							/>
						))}
						{/* Animated scan line */}
						<span
							style={{
								position: "absolute",
								left: 8,
								right: 8,
								height: 2,
								background:
									"linear-gradient(90deg, transparent, oklch(0.78 0.18 230), transparent)",
								boxShadow: "0 0 16px oklch(0.78 0.18 230)",
								animation: "sf-scan 2.4s ease-in-out infinite",
								top: 0,
							}}
						/>
					</div>
				)}
			</div>

			{/* Hint */}
			{!cameraError && (
				<div
					style={{
						position: "relative",
						zIndex: 2,
						textAlign: "center",
						padding: "0 18px 12px",
						fontSize: 13,
						color: "oklch(0.68 0.03 255)",
						letterSpacing: "-0.005em",
					}}
				>
					Pointez la caméra vers un QR Code StockFlow
				</div>
			)}

			{/* Bottom action bar */}
			<div
				style={{
					position: "relative",
					zIndex: 2,
					padding: "10px 18px 34px",
					display: "flex",
					alignItems: "center",
					gap: 12,
				}}
			>
				<button type="button" style={{ ...mobIconBtn, width: 44, height: 44 }}>
					<QRIcon />
				</button>
				<button
					type="button"
					style={{
						flex: 1,
						padding: "13px 14px",
						background: "oklch(0.55 0.16 255)",
						border: "1px solid oklch(0.45 0.14 255)",
						color: "white",
						borderRadius: 999,
						fontSize: 14,
						fontWeight: 500,
						fontFamily: "inherit",
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 6,
						cursor: "pointer",
					}}
				>
					<EditIcon />
					Saisir le code manuellement
				</button>
			</div>
		</div>
	);
}

/* ── Raw result screen ──────────────────────────────────────────── */

function RawResultScreen({
	result,
	onRescan,
}: { result: string; onRescan: () => void }) {
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "var(--sf-canvas)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				padding: "40px 18px",
				gap: 20,
				fontFamily: "var(--sf-sans)",
			}}
		>
			<Link to="/" style={{ alignSelf: "flex-start", textDecoration: "none" }}>
				<button
					type="button"
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						padding: "7px 12px 7px 9px",
						border: "1px solid var(--sf-border)",
						background: "var(--sf-bg)",
						borderRadius: 8,
						fontSize: 13,
						color: "var(--sf-fg-soft)",
						cursor: "pointer",
						fontFamily: "inherit",
					}}
				>
					<svg
						width={14}
						height={14}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.8}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="19" y1="12" x2="5" y2="12" />
						<polyline points="12 19 5 12 12 5" />
					</svg>
					Accueil
				</button>
			</Link>

			<h1
				style={{
					fontSize: 18,
					fontWeight: 600,
					color: "var(--sf-fg)",
					margin: 0,
					letterSpacing: "-0.01em",
				}}
			>
				QR Code détecté
			</h1>
			<p
				style={{
					fontSize: 12,
					color: "var(--sf-fg-muted)",
					fontFamily: "var(--sf-mono)",
					wordBreak: "break-all",
					maxWidth: 360,
					textAlign: "center",
					margin: 0,
				}}
			>
				{result}
			</p>
			<p style={{ fontSize: 13, color: "var(--sf-fg-muted)", margin: 0 }}>
				Ce QR code ne correspond pas à un équipement StockFlow.
			</p>
			<button
				type="button"
				onClick={onRescan}
				style={{
					width: "100%",
					maxWidth: 360,
					padding: "14px",
					border: "1px solid var(--sf-border)",
					background: "var(--sf-bg)",
					borderRadius: 10,
					fontSize: 14,
					fontWeight: 500,
					color: "var(--sf-fg)",
					cursor: "pointer",
					fontFamily: "inherit",
				}}
			>
				Scanner à nouveau
			</button>
		</div>
	);
}

/* ── Style constants ────────────────────────────────────────────── */

const mobIconBtn: React.CSSProperties = {
	width: 36,
	height: 36,
	borderRadius: "50%",
	background: "oklch(1 0 0 / 0.10)",
	border: "1px solid oklch(1 0 0 / 0.12)",
	color: "white",
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	cursor: "pointer",
	backdropFilter: "blur(8px)",
};

/* ── Inline icons ───────────────────────────────────────────────── */

function XIcon() {
	return (
		<svg
			width={18}
			height={18}
			viewBox="0 0 24 24"
			fill="none"
			stroke="white"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	);
}

function QRIcon() {
	return (
		<svg
			width={20}
			height={20}
			viewBox="0 0 24 24"
			fill="none"
			stroke="white"
			strokeWidth={1.6}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="3" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="3" width="7" height="7" rx="1" />
			<rect x="3" y="14" width="7" height="7" rx="1" />
			<path d="M14 14h3v3h-3z" />
			<path d="M20 14h1v1" />
			<path d="M14 20h1v1" />
			<path d="M17 17h4v4" />
		</svg>
	);
}

function EditIcon() {
	return (
		<svg
			width={14}
			height={14}
			viewBox="0 0 24 24"
			fill="none"
			stroke="white"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
			<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
		</svg>
	);
}
