import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanner({ onClose }) {
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    const scannerId = 'qr-scanner-container'
    const scanner = new Html5Qrcode(scannerId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // Parse URL and extract path for internal navigation
        try {
          const url = new URL(decodedText)
          const isOurApp = url.origin === window.location.origin
          scanner.stop().catch(() => {})
          onClose()
          if (isOurApp) {
            navigate(url.pathname + url.search)
          } else {
            window.location.href = decodedText
          }
        } catch {
          // Not a URL — ignore and keep scanning
        }
      },
      () => {} // frame error, ignore
    )
      .then(() => setStarting(false))
      .catch((err) => {
        setStarting(false)
        if (err?.message?.includes('Permission')) {
          setError('Không có quyền truy cập camera. Vui lòng cho phép trong cài đặt trình duyệt.')
        } else {
          setError('Không thể mở camera: ' + (err?.message || err))
        }
      })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [navigate, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-900">Scan QR Code</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Scanner area */}
        <div className="relative bg-gray-900">
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-white text-sm">Đang mở camera...</div>
            </div>
          )}
          <div id="qr-scanner-container" className="w-full" />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-600 text-sm text-center">{error}</div>
        )}

        <p className="text-center text-xs text-gray-400 py-3 px-4">
          Hướng camera vào QR code của sự kiện
        </p>
      </div>
    </div>
  )
}
