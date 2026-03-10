import { useState, useEffect } from 'react'

export default function InstallPWA() {
  const [prompt, setPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (installed || !prompt) return null

  const handleInstall = async () => {
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setPrompt(null)
  }

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 text-sm bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
    >
      <span>📲</span>
      <span>Cài ứng dụng</span>
    </button>
  )
}
