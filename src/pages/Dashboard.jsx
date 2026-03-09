import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import QRCodeDisplay from '../components/QRCodeDisplay'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [attendances, setAttendances] = useState([])
  const [loadingAttendances, setLoadingAttendances] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState(null)

  // Load events
  useEffect(() => {
    if (!user) return

    supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
        } else {
          setEvents(data || [])
        }
        setLoadingEvents(false)
      })
  }, [user])

  // Load attendances for selected event
  const loadAttendances = useCallback(async (event) => {
    setSelectedEvent(event)
    setShowQR(false)
    setLoadingAttendances(true)
    setError(null)

    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('event_id', event.id)
      .order('checked_in_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setAttendances(data || [])
    }
    setLoadingAttendances(false)
  }, [])

  const togglePayment = async (attendance) => {
    setUpdatingId(attendance.id)
    const newStatus = !attendance.has_paid

    const { error } = await supabase
      .from('attendances')
      .update({ has_paid: newStatus })
      .eq('id', attendance.id)

    if (!error) {
      setAttendances((prev) =>
        prev.map((a) =>
          a.id === attendance.id ? { ...a, has_paid: newStatus } : a
        )
      )
    } else {
      setError('Không thể cập nhật trạng thái thanh toán.')
    }
    setUpdatingId(null)
  }

  const checkinUrl = selectedEvent
    ? `${window.location.origin}/checkin/${selectedEvent.id}`
    : null

  const paidCount = attendances.filter((a) => a.has_paid).length
  const unpaidCount = attendances.length - paidCount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span className="font-bold text-gray-900">CheckIn</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              {user?.email}
            </span>
            <Link to="/create" className="btn-primary text-sm py-2 px-4">
              + Tạo sự kiện
            </Link>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Events list */}
          <div className="lg:w-80 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Sự kiện của bạn
            </h2>

            {loadingEvents ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : events.length === 0 ? (
              <div className="card text-center py-10">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500 text-sm mb-4">Chưa có sự kiện nào</p>
                <Link to="/create" className="btn-primary text-sm">
                  Tạo sự kiện đầu tiên
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => loadAttendances(event)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedEvent?.id === event.id
                        ? 'bg-primary-50 border-primary-200 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {event.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {event.type === 'one-time' ? 'Một lần' : 'Định kỳ'}
                      </span>
                      {event.cost > 0 && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">
                            {event.cost.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Event detail */}
          <div className="flex-1 min-w-0">
            {!selectedEvent ? (
              <div className="card flex flex-col items-center justify-center py-16 text-center">
                <div className="text-5xl mb-4">👈</div>
                <p className="text-gray-500">Chọn một sự kiện để xem chi tiết</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Event header */}
                <div className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">
                        {selectedEvent.name}
                      </h1>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                          {selectedEvent.type === 'one-time' ? 'Một lần' : 'Định kỳ'}
                        </span>
                        {selectedEvent.cost > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            {selectedEvent.cost.toLocaleString('vi-VN')} VNĐ / người
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            Miễn phí
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowQR((v) => !v)}
                      className="btn-secondary text-sm py-2 flex-shrink-0"
                    >
                      {showQR ? 'Ẩn QR' : 'Xem QR'}
                    </button>
                  </div>

                  {showQR && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <QRCodeDisplay url={checkinUrl} eventName={selectedEvent.name} />
                    </div>
                  )}
                </div>

                {/* Stats */}
                {!loadingAttendances && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Tổng người', value: attendances.length, color: 'text-gray-900' },
                      { label: 'Đã thanh toán', value: paidCount, color: 'text-green-600' },
                      { label: 'Chưa thanh toán', value: unpaidCount, color: 'text-red-500' },
                    ].map((stat) => (
                      <div key={stat.label} className="card text-center py-4">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Attendances */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Danh sách điểm danh
                  </h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {loadingAttendances ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : attendances.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-3xl mb-2">🙈</p>
                      <p className="text-sm">Chưa có ai điểm danh</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {attendances.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between py-3 gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              {att.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {att.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(att.checked_in_at).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => togglePayment(att)}
                            disabled={updatingId === att.id}
                            className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                              att.has_paid
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-50 text-red-500 hover:bg-red-100'
                            }`}
                          >
                            {updatingId === att.id ? (
                              <LoadingSpinner size="sm" />
                            ) : att.has_paid ? (
                              <>✓ Đã trả</>
                            ) : (
                              <>✗ Chưa trả</>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
