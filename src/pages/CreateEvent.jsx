import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import QRCodeDisplay from '../components/QRCodeDisplay'
import LoadingSpinner from '../components/LoadingSpinner'

const EVENT_TYPES = [
  { value: 'one-time', label: 'Một lần', desc: 'Sự kiện diễn ra một lần' },
  { value: 'recurring', label: 'Định kỳ', desc: 'Sự kiện lặp lại nhiều lần' },
]

export default function CreateEvent() {
  const { user, signOut } = useAuth()
  const [form, setForm] = useState({ name: '', type: 'one-time', cost: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [createdEvent, setCreatedEvent] = useState(null)

  const checkinUrl = createdEvent
    ? `${window.location.origin}/checkin/${createdEvent.id}`
    : null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          name: form.name.trim(),
          type: form.type,
          cost: form.cost ? parseInt(form.cost, 10) : null,
          owner_id: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError
      setCreatedEvent(data)
    } catch (err) {
      setError(err.message || 'Tạo sự kiện thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCreatedEvent(null)
    setForm({ name: '', type: 'one-time', cost: '' })
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-900">Tạo sự kiện mới</span>
          </div>
          <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Đăng xuất
          </button>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-10">
        {!createdEvent ? (
          <div className="card">
            <h1 className="text-xl font-bold text-gray-900 mb-6">Thông tin sự kiện</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tên sự kiện */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên sự kiện <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ví dụ: Họp nhóm tháng 3"
                  className="input-field"
                  required
                  maxLength={120}
                />
              </div>

              {/* Loại sự kiện */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Loại sự kiện
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {EVENT_TYPES.map((t) => (
                    <label
                      key={t.value}
                      className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        form.type === t.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={t.value}
                        checked={form.type === t.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="font-semibold text-sm text-gray-900">{t.label}</span>
                      <span className="text-xs text-gray-500">{t.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Chi phí */}
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Chi phí tham dự (VNĐ)
                  <span className="text-gray-400 font-normal ml-1">— tuỳ chọn</span>
                </label>
                <div className="relative">
                  <input
                    id="cost"
                    name="cost"
                    type="number"
                    value={form.cost}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="1000"
                    className="input-field pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">VNĐ</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !form.name.trim()}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Đang tạo...
                  </span>
                ) : (
                  'Tạo sự kiện & lấy QR Code'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Success banner */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-semibold text-green-800">Tạo sự kiện thành công!</p>
                <p className="text-sm text-green-600 mt-0.5">
                  Chia sẻ QR code bên dưới để mọi người điểm danh.
                </p>
              </div>
            </div>

            {/* Event info */}
            <div className="card">
              <h2 className="font-bold text-lg text-gray-900 mb-1">{createdEvent.name}</h2>
              <div className="flex gap-3 text-sm text-gray-500 mb-6">
                <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {createdEvent.type === 'one-time' ? 'Một lần' : 'Định kỳ'}
                </span>
                {createdEvent.cost ? (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                    {createdEvent.cost.toLocaleString('vi-VN')} VNĐ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    Miễn phí
                  </span>
                )}
              </div>

              <QRCodeDisplay url={checkinUrl} eventName={createdEvent.name} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/dashboard" className="btn-primary flex-1 text-center">
                Đến Dashboard
              </Link>
              <button onClick={handleReset} className="btn-secondary flex-1">
                Tạo sự kiện khác
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
