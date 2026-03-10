import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'

export default function History() {
  const { user, signOut } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return

    supabase
      .from('attendances')
      .select('id, name, date, checked_in_at, has_paid, event_id, events(id, name, cost, type, is_public)')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRecords(data || [])
        setLoading(false)
      })
  }, [user])

  // Group by event
  const byEvent = records.reduce((acc, r) => {
    const eid = r.event_id
    if (!acc[eid]) acc[eid] = { event: r.events, checkins: [] }
    acc[eid].checkins.push(r)
    return acc
  }, {})
  const eventGroups = Object.values(byEvent)

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-900">Lịch sử điểm danh</span>
          </div>
          <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Đăng xuất
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
        ) : eventGroups.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">Bạn chưa điểm danh sự kiện nào.</p>
            <p className="text-xs mt-1">Scan QR code của sự kiện để bắt đầu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventGroups.map(({ event, checkins }) => {
              const totalPaid = checkins.filter((c) => c.has_paid).length
              const cost = event?.cost || 0
              return (
                <div key={event?.id} className="card">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{event?.name || 'Sự kiện đã xoá'}</h3>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {event?.type === 'recurring' ? 'Định kỳ' : 'Một lần'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          event?.is_public
                            ? 'bg-green-50 text-green-600'
                            : 'bg-orange-50 text-orange-600'
                        }`}>
                          {event?.is_public ? 'Công khai' : 'Riêng tư'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <p className="font-semibold text-gray-900">{checkins.length} lần</p>
                      {cost > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {(totalPaid * cost).toLocaleString('vi-VN')} / {(checkins.length * cost).toLocaleString('vi-VN')} VNĐ
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {checkins.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-sm py-1 border-t border-gray-50">
                        <span className="text-gray-500">{formatDate(c.date || c.checked_in_at)}</span>
                        {cost > 0 && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            c.has_paid ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                          }`}>
                            {c.has_paid ? 'Đã trả' : 'Chưa trả'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
