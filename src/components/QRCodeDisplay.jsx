import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

export default function QRCodeDisplay({ url, eventName }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!url || !canvasRef.current) return

    QRCode.toCanvas(canvasRef.current, url, {
      width: 240,
      margin: 2,
      color: {
        dark: '#1e40af',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    }).catch((err) => {
      setError(err.message)
    })
  }, [url])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `qr-${eventName || 'checkin'}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  if (error) {
    return (
      <div className="text-center p-4 bg-red-50 rounded-xl text-red-600 text-sm">
        Không thể tạo QR code: {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
        <canvas ref={canvasRef} className="block" />
      </div>

      <div className="w-full bg-gray-50 rounded-xl p-3 flex items-center gap-2">
        <span className="text-xs text-gray-500 flex-1 truncate font-mono">{url}</span>
        <button
          onClick={handleCopyLink}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap transition-colors"
        >
          {copied ? '✓ Đã copy' : 'Copy'}
        </button>
      </div>

      <button
        onClick={handleDownload}
        className="btn-secondary text-sm w-full"
      >
        Tải QR Code về máy
      </button>
    </div>
  )
}
