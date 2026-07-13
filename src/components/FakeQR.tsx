interface FakeQRProps {
	value?: string;
	size?: number;
}

export function FakeQR({ value, size = 200 }: FakeQRProps) {
	const cells = 21;
	const cell = size / cells;
	const seed = value || "stockflow";
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
	const rand = (x: number, y: number) => {
		const n = Math.sin(h + x * 374.7 + y * 137.3) * 43758.5453;
		return n - Math.floor(n);
	};
	const dots: [number, number][] = [];
	for (let y = 0; y < cells; y++) {
		for (let x = 0; x < cells; x++) {
			const inMarker = (cx: number, cy: number) =>
				x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
			const onMarkerRing = (cx: number, cy: number) =>
				(inMarker(cx, cy) && !(x > cx && x < cx + 6 && y > cy && y < cy + 6)) ||
				(x >= cx + 2 && x < cx + 5 && y >= cy + 2 && y < cy + 5);
			const isMarker =
				onMarkerRing(0, 0) ||
				onMarkerRing(cells - 7, 0) ||
				onMarkerRing(0, cells - 7);
			const isMarkerArea =
				inMarker(0, 0) || inMarker(cells - 7, 0) || inMarker(0, cells - 7);
			if (isMarkerArea) {
				if (isMarker) dots.push([x, y]);
				continue;
			}
			if (rand(x, y) > 0.55) dots.push([x, y]);
		}
	}
	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
			<title>QR code (aperçu)</title>
			<rect width={size} height={size} fill="white" />
			{dots.map(([x, y]) => (
				<rect
					key={`${x}-${y}`}
					x={x * cell}
					y={y * cell}
					width={cell}
					height={cell}
					fill="oklch(0.18 0.02 255)"
					rx={cell * 0.15}
				/>
			))}
		</svg>
	);
}
