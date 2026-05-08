import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
					{ fps: 10, qrbox: { width: 250, height: 250 } },
					(decodedText: string) => {
						if (cancelled) return;
						scanner.stop().then(() => scanner.clear()).catch(() => {});
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
					setCameraError(
						"Impossible d'accéder à la caméra. Vérifiez les permissions.",
					);
				}
			}
		}

		startScanner();

		return () => {
			cancelled = true;
			const scanner = scannerRef.current;
			if (scanner) {
				scanner.stop().then(() => scanner.clear()).catch(() => {});
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
		return (
			<div
				style={{
					minHeight: "100vh",
					background: "var(--sf-canvas)",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					padding: "40px 16px",
					gap: 24,
				}}
			>
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
					{rawResult}
				</p>
				<p style={{ fontSize: 13, color: "var(--sf-fg-muted)", margin: 0 }}>
					Ce QR code ne correspond pas à un équipement StockFlow.
				</p>
				<button
					type="button"
					aria-label="Scanner un nouveau QR code"
					onClick={handleRescan}
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

	return (
		<div
			style={{
				minHeight: "100vh",
				background: "var(--sf-canvas)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				padding: "40px 16px",
				gap: 20,
			}}
		>
			<h1
				style={{
					fontSize: 18,
					fontWeight: 600,
					color: "var(--sf-fg)",
					margin: 0,
					letterSpacing: "-0.01em",
				}}
			>
				Scanner un QR Code
			</h1>

			{cameraError ? (
				<div
					role="alert"
					style={{
						background: "oklch(0.97 0.03 25)",
						border: "1px solid oklch(0.85 0.08 25)",
						borderRadius: 10,
						padding: "14px 18px",
						fontSize: 13.5,
						color: "oklch(0.40 0.14 25)",
						maxWidth: 360,
						width: "100%",
					}}
				>
					{cameraError}
				</div>
			) : (
				<>
					<div
						id={READER_ID}
						aria-label="Fenêtre de scan QR code"
						style={{
							width: "100%",
							maxWidth: 380,
							minHeight: 300,
							overflow: "hidden",
							borderRadius: 16,
							border: "2px dashed oklch(0.65 0.12 255)",
							background: "black",
						}}
					/>
					<p
						style={{ fontSize: 13, color: "var(--sf-fg-muted)", margin: 0 }}
					>
						Pointez la caméra vers un QR Code StockFlow
					</p>
				</>
			)}
		</div>
	);
}
