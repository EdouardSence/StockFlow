import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

export const Route = createFileRoute('/scan')({
  component: ScanPage,
})

const READER_ID = 'stockflow-qr-reader'

function ScanPage() {
  const [scanKey, setScanKey] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const scanner = new Html5Qrcode(READER_ID)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            if (cancelled) return
            scanner.stop().then(() => scanner.clear()).catch(() => {})
            scannerRef.current = null
            setResult(decodedText)
          },
          () => {},
        )
      } catch {
        if (!cancelled) {
          setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.")
        }
      }
    }

    startScanner()

    return () => {
      cancelled = true
      const scanner = scannerRef.current
      if (scanner) {
        scanner.stop().then(() => scanner.clear()).catch(() => {})
        scannerRef.current = null
      }
    }
  }, [scanKey])

  function handleRescan() {
    setCameraError(null)
    setResult(null)
    setScanKey((k) => k + 1)
  }

  if (result) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
        <h1 className="mb-2 text-xl font-bold text-gray-900">Équipement détecté</h1>
        <p className="mb-8 break-all font-mono text-xs text-gray-500">{result}</p>

        <div className="w-full max-w-sm space-y-4">
          <button
            type="button"
            onClick={() => {
              console.log('Assigner équipement:', result)
              alert(`Assigner : ${result}`)
            }}
            className="w-full rounded-2xl bg-indigo-600 py-5 text-lg font-semibold text-white shadow-md active:scale-95 hover:bg-indigo-700 transition-transform"
          >
            Assigner
          </button>
          <button
            type="button"
            onClick={() => {
              console.log('Déclarer en panne:', result)
              alert(`Panne déclarée : ${result}`)
            }}
            className="w-full rounded-2xl bg-red-600 py-5 text-lg font-semibold text-white shadow-md active:scale-95 hover:bg-red-700 transition-transform"
          >
            Déclarer en panne
          </button>
          <button
            type="button"
            onClick={handleRescan}
            className="w-full rounded-2xl border border-gray-300 py-4 text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            Scanner à nouveau
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Scanner un QR Code</h1>

      {cameraError ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{cameraError}</div>
      ) : (
        <>
          <div
            id={READER_ID}
            className="w-full max-w-sm overflow-hidden rounded-2xl border-2 border-dashed border-indigo-300 bg-black"
            style={{ minHeight: '300px' }}
          />
          <p className="mt-4 text-sm text-gray-500">
            Pointez la caméra vers un QR Code StockFlow
          </p>
        </>
      )}
    </div>
  )
}
