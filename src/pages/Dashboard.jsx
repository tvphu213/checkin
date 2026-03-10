import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import QRCodeDisplay from '../components/QRCodeDisplay'
import InstallPWA from '../components/InstallPWA'
import QRScanner from '../components/QRScanner'

const PREVIEW_COUNT = 3

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [showScanner, setShowScanner] = useState(false)

  // Owned events
  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [showAllOwned, setShowAllOwned] = useState(false)

  // Expanded event detail (accordion)
  const [expandedId, setExpandedId] = useState(null)
  const [attendances, setAttendances] = useState([])
  const [loadingAttendances, setLoadingAttendances] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [activeView, setActiveView] = useState('date')
  const [updatingId, setUpdatingId] = useState(null)
  const [detailError, setDetailError] = useState(null)

  // History
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showAllHistory, setShowAllHistory] = useState(false)

  const expandedEvent = events.find((e) => e.id === expandedId) || null

  useEffect(() => {
    if (!user) return

    supabase
      .from('events')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setEvents(data || [])
        setLoadingEvents(false)
      })

    supabase
      .from('attendances')
      .select('id, name, date, checked_in_at, has_paid, event_id, events(id, name, cost, type, is_public)')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .then(({ data }) => {
        setHistory(data || [])
        setLoadingHistory(false)
      })
  }, [user])

  const loadAttendances = useCallback(async (eventId) => {
    setLoadingAttendances(true)
    setDetailError(null)
    setActiveView('date')
    setShowQR(false)
    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: false })
    if (error) setDetailError(error.message)
    else setAttendances(data || [])
    setLoadingAttendances(false)
  }, [])

  const toggleExpand = useCallback((event) => {
    if (expandedId === event.id) {
      setExpandedId(null)
    } else {
      setExpandedId(event.id)
      loadAttendances(event.id)
    }
  }, [expandedId, loadAttendances])

  const togglePayment = async (att) => {
    setUpdatingId(att.id)
    const newStatus = !att.has_paid
    const { error } = await supabase.from('attendances').update({ has_paid: newStatus }).eq('id', att.id)
    if (!error) {
      setAttendances((prev) => prev.map((a) => a.id === att.id ? { ...a, has_paid: newStatus } : a))
    } else {
      setDetailError('Không thể cập nhật trạng thái thanh toán.')
    }
    setUpdatingId(null)
  }

  // Derived stats for expanded event
  const byPerson = attendances.reduce((acc, att) => {
    const key = att.name.trim().toLowerCase()
    if (!acc[key]) acc[key] = { displayName: att.name.trim(), sessions: 0, paid: 0 }
    acc[key].sessions++
    if (att.has_paid) acc[key].paid++
    return acc
  }, {})
  const peopleStats = Object.values(byPerson).sort((a, b) => a.displayName.localeCompare(b.displayName))
  const uniqueCount = peopleStats.length
  const paidCount = attendances.filter((a) => a.has_paid).length
  const unpaidCount = attendances.length - paidCount
  const cost = expandedEvent?.cost || 0

  const attendancesByDate = attendances.reduce((acc, att) => {
    const day = att.date || att.checked_in_at.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(att)
    return acc
  }, {})
  const sortedDates = Object.keys(attendancesByDate).sort((a, b) => b.localeCompare(a))

  // History grouped by event
  const historyByEvent = history.reduce((acc, r) => {
    const eid = r.event_id
    if (!acc[eid]) acc[eid] = { event: r.events, checkins: [] }
    acc[eid].checkins.push(r)
    return acc
  }, {})
  const historyGroups = Object.values(historyByEvent)

  const visibleEvents = showAllOwned ? events : events.slice(0, PREVIEW_COUNT)
  const visibleHistory = showAllHistory ? historyGroups : historyGroups.slice(0, PREVIEW_COUNT)

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span className="font-bold text-gray-900">CheckIn</span>
          </div>
          <div className="flex items-center gap-3">
            <InstallPWA />
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              <span>📷</span>
              <span className="hidden sm:inline">Scan QR</span>
            </button>
            <span className="text-sm text-gray-500 hidden sm:block truncate max-w-[140px]">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email}
            </span>
            <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* === Sự kiện của bạn === */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sự kiện của bạn</h2>
            <Link to="/create" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
              + Tạo mới
            </Link>
          </div>

          {loadingEvents ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : events.length === 0 ? (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 text-sm mb-4">Chưa có sự kiện nào</p>
              <Link to="/create" className="btn-primary text-sm">Tạo sự kiện đầu tiên</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleEvents.map((event) => {
                const isExpanded = expandedId === event.id
                return (
                  <div key={event.id} className="rounded-xl border overflow-hidden bg-white transition-all">
                    {/* Card header */}
                    <button
                      onClick={() => toggleExpand(event)}
                      className={`w-full text-left p-4 transition-colors ${isExpanded ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate">{event.name}</p>
                        <span className={`text-gray-400 text-xs transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">{event.type === 'one-time' ? 'Một lần' : 'Định kỳ'}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${event.is_public ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                          {event.is_public ? 'Công khai' : 'Riêng tư'}
                        </span>
                        {event.cost > 0 && (
                          <span className="text-xs text-gray-400">{event.cost.toLocaleString('vi-VN')} VNĐ/người</span>
                        )}
                      </div>
                    </button>

                    {/* Inline detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 space-y-4">
                        {/* QR toggle */}
                        <div className="flex justify-end">
                          <button onClick={() => setShowQR((v) => !v)} className="btn-secondary text-sm py-1.5 px-3">
                            {showQR ? 'Ẩn QR' : 'Xem QR'}
                          </button>
                        </div>
                        {showQR && (
                          <QRCodeDisplay
                            url={`${window.location.origin}/checkin/${event.id}`}
                            eventName={event.name}
                          />
                        )}

                        {detailError && (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{detailError}</div>
                        )}

                        {loadingAttendances ? (
                          <div className="flex justify-center py-6"><LoadingSpinner /></div>
                        ) : (
                          <>
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2">
                              <button onClick={() => setActiveView('date')} className={`card text-center py-3 transition-all ${activeView === 'date' ? 'ring-2 ring-primary-400' : 'hover:shadow-md'}`}>
                                <p className="text-xl font-bold text-gray-900">{uniqueCount}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Người</p>
                                {attendances.length !== uniqueCount && <p className="text-xs text-gray-400">{attendances.length} lượt</p>}
                              </button>
                              <button onClick={() => setActiveView('paid')} className={`card text-center py-3 transition-all ${activeView === 'paid' ? 'ring-2 ring-green-400' : 'hover:shadow-md'}`}>
                                <p className="text-xl font-bold text-green-600">{paidCount}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Đã trả</p>
                                {cost > 0 && <p className="text-xs text-green-500">{(paidCount * cost).toLocaleString('vi-VN')}đ</p>}
                              </button>
                              <button onClick={() => setActiveView('unpaid')} className={`card text-center py-3 transition-all ${activeView === 'unpaid' ? 'ring-2 ring-red-400' : 'hover:shadow-md'}`}>
                                <p className="text-xl font-bold text-red-500">{unpaidCount}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Chưa trả</p>
                                {cost > 0 && <p className="text-xs text-red-400">{(unpaidCount * cost).toLocaleString('vi-VN')}đ</p>}
                              </button>
                            </div>

                            {/* Attendance list */}
                            {attendances.length === 0 ? (
                              <div className="text-center py-6 text-gray-400">
                                <p className="text-3xl mb-2">🙈</p>
                                <p className="text-sm">Chưa có ai điểm danh</p>
                              </div>
                            ) : (activeView === 'paid' || activeView === 'unpaid') ? (
                              <div className="divide-y divide-gray-50">
                                {peopleStats
                                  .filter((p) => activeView === 'paid' ? p.paid > 0 : p.paid < p.sessions)
                                  .map((p) => {
                                    const unpaid = p.sessions - p.paid
                                    return (
                                      <div key={p.displayName} className="flex items-center justify-between py-3 gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                            {p.displayName.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">{p.displayName}</p>
                                            <p className="text-xs text-gray-400">{p.sessions} buổi · {p.paid} đã trả · {unpaid} chưa trả</p>
                                          </div>
                                        </div>
                                        {cost > 0 && (
                                          <div className="text-right flex-shrink-0">
                                            {activeView === 'unpaid' && unpaid > 0 && <p className="text-sm font-semibold text-red-500">-{(unpaid * cost).toLocaleString('vi-VN')}đ</p>}
                                            {activeView === 'paid' && p.paid > 0 && <p className="text-sm font-semibold text-green-600">+{(p.paid * cost).toLocaleString('vi-VN')}đ</p>}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                {peopleStats.filter((p) => activeView === 'paid' ? p.paid > 0 : p.paid < p.sessions).length === 0 && (
                                  <p className="text-center py-6 text-sm text-gray-400">Không có ai</p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {sortedDates.map((day) => {
                                  const group = attendancesByDate[day]
                                  const dayPaid = group.filter((a) => a.has_paid).length
                                  return (
                                    <div key={day}>
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-gray-700">{formatDate(day)}</span>
                                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{group.length} người</span>
                                        </div>
                                        {event.cost > 0 && <span className="text-xs text-gray-400">{dayPaid}/{group.length} đã trả</span>}
                                      </div>
                                      <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                                        {group.map((att) => (
                                          <div key={att.id} className="flex items-center justify-between px-4 py-3 gap-3 bg-white">
                                            <div className="flex items-center gap-3 min-w-0">
                                              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                                {att.name.charAt(0).toUpperCase()}
                                              </div>
                                              <p className="font-medium text-sm text-gray-900 truncate">{att.name}</p>
                                            </div>
                                            <button
                                              onClick={() => togglePayment(att)}
                                              disabled={updatingId === att.id}
                                              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                                                att.has_paid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'
                                              }`}
                                            >
                                              {updatingId === att.id ? <LoadingSpinner size="sm" /> : att.has_paid ? <>✓ Đã trả</> : <>✗ Chưa trả</>}
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {events.length > PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAllOwned((v) => !v)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
                >
                  {showAllOwned ? 'Thu gọn' : `Xem thêm ${events.length - PREVIEW_COUNT} sự kiện`}
                </button>
              )}
            </div>
          )}
        </section>

        {/* === Lịch sử điểm danh === */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Lịch sử điểm danh</h2>

          {loadingHistory ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : historyGroups.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">Chưa có lịch sử điểm danh nào.</p>
              <p className="text-xs mt-1">Scan QR của sự kiện để bắt đầu.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleHistory.map(({ event, checkins }) => {
                const totalPaid = checkins.filter((c) => c.has_paid).length
                const evCost = event?.cost || 0
                return (
                  <div key={event?.id} className="card">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{event?.name || 'Sự kiện đã xoá'}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {event?.type === 'recurring' ? 'Định kỳ' : 'Một lần'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${event?.is_public ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                            {event?.is_public ? 'Công khai' : 'Riêng tư'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm shrink-0">
                        <p className="font-semibold text-gray-900">{checkins.length} lần</p>
                        {evCost > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {(totalPaid * evCost).toLocaleString('vi-VN')} / {(checkins.length * evCost).toLocaleString('vi-VN')} VNĐ
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      {checkins.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-sm py-1 border-t border-gray-50">
                          <span className="text-gray-500 text-xs">{new Date(c.date || c.checked_in_at).toLocaleDateString('vi-VN')}</span>
                          {evCost > 0 && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.has_paid ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                              {c.has_paid ? 'Đã trả' : 'Chưa trả'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {historyGroups.length > PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAllHistory((v) => !v)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
                >
                  {showAllHistory ? 'Thu gọn' : `Xem thêm ${historyGroups.length - PREVIEW_COUNT} sự kiện`}
                </button>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
