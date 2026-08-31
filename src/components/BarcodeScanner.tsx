'use client'

import { useEffect, useRef, useState } from 'react'

export interface ScannedFood {
  name: string
  caloriesPer100: number
  proteinPer100: number
  carbsPer100: number
  fatsPer100: number
  fiberPer100: number
}

interface Props {
  onScanned: (food: ScannedFood) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScanned, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'fetching' | 'error' | 'unsupported'>('starting')
  const [errorMsg, setErrorMsg] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const didScan = useRef(false)

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setStatus('unsupported')
      return
    }
    startCamera()
    return () => { stopCamera() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('scanning')
      startScanning()
    } catch {
      setStatus('error')
      setErrorMsg('Camera access denied. Allow camera permission and retry.')
    }
  }

  const startScanning = () => {
    // @ts-expect-error BarcodeDetector not yet in TS lib
    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'] })
    scanIntervalRef.current = setInterval(async () => {
      if (didScan.current || !videoRef.current || videoRef.current.readyState < 2) return
      try {
        const barcodes = await detector.detect(videoRef.current)
        if (barcodes.length > 0) {
          didScan.current = true
          stopCamera()
          setStatus('fetching')
          await fetchProduct(barcodes[0].rawValue)
        }
      } catch { /* frame error, continue */ }
    }, 300)
  }

  const fetchProduct = async (barcode: string) => {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        { headers: { 'User-Agent': 'ElitePT-App/1.0' } }
      )
      const data = await res.json()

      if (data.status !== 1 || !data.product) {
        setStatus('error')
        setErrorMsg(`Barcode ${barcode} not found. Try searching by name instead.`)
        return
      }

      const n = data.product.nutriments ?? {}
      const name = data.product.product_name || data.product.product_name_en || 'Unknown Product'

      // energy may be in kJ; prefer kcal field
      const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? Math.round(n['energy_100g'] / 4.184) : 0)

      onScanned({
        name: name.trim(),
        caloriesPer100: Math.round(kcal),
        proteinPer100: Math.round(n['proteins_100g'] ?? 0),
        carbsPer100: Math.round(n['carbohydrates_100g'] ?? 0),
        fatsPer100: Math.round(n['fat_100g'] ?? 0),
        fiberPer100: Math.round(n['fiber_100g'] ?? 0),
      })
    } catch {
      setStatus('error')
      setErrorMsg('Could not fetch product data. Check your connection.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-base">Scan Barcode</h3>
          <button onClick={() => { stopCamera(); onClose() }} className="text-gray-400 text-sm font-bold">
            Cancel
          </button>
        </div>

        {status === 'unsupported' && (
          <div className="text-center py-8 space-y-2">
            <p className="text-gray-300 text-sm">Barcode scanning not supported in this browser.</p>
            <p className="text-gray-500 text-xs">Use Chrome on Android, or Safari 17+ on iOS.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8 space-y-3">
            <p className="text-red-400 text-sm">{errorMsg}</p>
            <button
              onClick={() => { didScan.current = false; setStatus('starting'); startCamera() }}
              className="text-xs text-gray-400 underline"
            >
              Try again
            </button>
          </div>
        )}

        {status === 'fetching' && (
          <div className="text-center py-8">
            <p className="text-gray-300 text-sm animate-pulse">Looking up product...</p>
          </div>
        )}

        {(status === 'starting' || status === 'scanning') && (
          <div className="relative">
            <video ref={videoRef} className="w-full rounded-2xl aspect-video object-cover" playsInline muted />
            {/* Targeting overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-32">
                {/* Corner markers */}
                {[['top-0 left-0', 'border-t-2 border-l-2'],
                  ['top-0 right-0', 'border-t-2 border-r-2'],
                  ['bottom-0 left-0', 'border-b-2 border-l-2'],
                  ['bottom-0 right-0', 'border-b-2 border-r-2'],
                ].map(([pos, border], i) => (
                  <div key={i} className={`absolute ${pos} w-5 h-5 border-[var(--accent)] ${border} rounded-sm`} />
                ))}
                {/* Scan line */}
                {status === 'scanning' && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--accent)] opacity-80 animate-bounce" style={{ animationDuration: '1.5s' }} />
                )}
              </div>
            </div>
            <p className="text-center text-gray-400 text-xs mt-3">
              {status === 'starting' ? 'Starting camera...' : 'Point at a barcode'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
