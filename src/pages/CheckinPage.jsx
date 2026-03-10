import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import InstallPWA from '../components/InstallPWA'

const EMPTY_PERSON = () => ({ id: crypto.randomUUID(), name: '', note: '', hasDuplicate: false })

const today = () => new Date().toISOString().slice(0, 10)

export default function CheckinPage() {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [todayNames, setTodayNames] = useState(new Set()) // lowercase names already checked in today

  const [people, setPeople] = useState([EMPTY_PERSON()])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Fetch event info + today's attendances
  useEffect(() => {
    if (!eventId) return

    supabase
      .from('events')
      .select('id, name, cost, type')
      .eq('id', eventId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
          setLoadingEvent(false)
          return
        }
        setEvent(data)
        setLoadingEvent(false)

        // Load today's names
        supabase
          .from('attendances')
          .select('name')
          .eq('event_id', eventId)
          .eq('date', today())
          .then(({ data: rows }) => {
            if (rows) {
              setTodayNames(new Set(rows.map((r) => r.name.trim().toLowerCase())))
            }
          })
      })
  }, [eventId])

  const addPerson = useCallback(() => {
    setPeople((prev) => [...prev, EMPTY_PERSON()])
  }, [])

  const removePerson = useCallback((id) => {
    setPeople((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const updatePerson = useCallback((id, field, value) => {
    setPeople((prev) =>
      prev.map((p) => p.id === id ? { ...p, [field]: value, hasDuplicate: false } : p)
    )
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    const validPeople = people.filter((p) => p.name.trim())
    if (validPeople.length === 0) {
      setSubmitError('Vui lòng nhập ít nhất một tên.')
      return
    }

    // Check duplicates: name trùng hôm nay mà chưa có ghi chú
    const duplicates = validPeople.filter(
      (p) => todayNames.has(p.name.trim().toLowerCase()) && !p.note.trim()
    )

    if (duplicates.length > 0) {
      setPeople((prev) =>
        prev.map((p) =>
          duplicates.find((d) => d.id === p.id) ? { ...p, hasDuplicate: true } : p
        )
      )
      return
    }

    setSubmitting(true)
    try {
      const rows = validPeople.map((p) => ({
        event_id: eventId,
        name: p.note.trim()
          ? `${p.name.trim()} (${p.note.trim()})`
          : p.name.trim(),
      }))

      const { error } = await supabase.from('attendances').insert(rows)
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      setSubmitError(err.message || 'Điểm danh thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckinAgain = () => {
    setSuccess(false)
    setPeople([EMPTY_PERSON()])
  }

  if (loadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sự kiện</h1>
        <p className="text-gray-500 text-sm mb-6">
          Link này không hợp lệ hoặc sự kiện đã bị xoá.
        </p>
        <Link to="/" className="btn-primary">Về trang chủ</Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col items-center justify-center px-4">
        <div className="card max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Điểm danh thành công!</h1>
          <p className="text-gray-500 text-sm mb-2">
            Sự kiện: <span className="font-medium text-gray-700">{event.name}</span>
          </p>
          {event.cost > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full mt-2 mb-4">
              <span>💰</span>
              <span>Nhớ thanh toán {event.cost.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          )}
          <div className="flex justify-center mt-4">
            <InstallPWA />
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
            <button onClick={handleCheckinAgain} className="btn-secondary w-full">
              Điểm danh người khác
            </button>
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white px-6 pt-10 pb-16">
        <div className="max-w-lg mx-auto">
          <p className="text-primary-200 text-sm font-medium mb-1">Điểm danh</p>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1 bg-primary-500 bg-opacity-60 text-white text-xs px-3 py-1 rounded-full">
              {event.type === 'one-time' ? 'Sự kiện một lần' : 'Sự kiện định kỳ'}
            </span>
            {event.cost > 0 ? (
              <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-1 rounded-full">
                💰 {event.cost.toLocaleString('vi-VN')} VNĐ / người
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-green-400 text-green-900 text-xs font-semibold px-3 py-1 rounded-full">
                Miễn phí
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 -mt-8 pb-10">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Nhập tên người tham dự
          </h2>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {people.map((person, index) => (
              <div key={person.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 text-xs text-gray-400 text-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                    placeholder={`Tên người ${index + 1}`}
                    className={`input-field flex-1 ${person.hasDuplicate ? 'border-amber-400 focus:ring-amber-400' : ''}`}
                    maxLength={80}
                    autoFocus={index === 0}
                  />
                  {people.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerson(person.id)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label="Xoá"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Note field — hiện khi tên bị trùng */}
                {person.hasDuplicate && (
                  <div className="ml-8 space-y-1">
                    <p className="text-xs text-amber-600 font-medium">
                      ⚠️ Tên "<span className="font-semibold">{person.name.trim()}</span>" đã điểm danh hôm nay. Thêm ghi chú để phân biệt.
                    </p>
                    <input
                      type="text"
                      value={person.note}
                      onChange={(e) => updatePerson(person.id, 'note', e.target.value)}
                      placeholder='Ghi chú, ví dụ: "Lớp A", "Con trai"...'
                      className="input-field text-sm"
                      maxLength={40}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addPerson}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-primary-400 text-gray-400 hover:text-primary-600 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              + Thêm người
            </button>

            <button
              type="submit"
              disabled={submitting || people.every((p) => !p.name.trim())}
              className="btn-primary w-full mt-2"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Đang điểm danh...
                </span>
              ) : (
                `Điểm danh (${people.filter((p) => p.name.trim()).length} người)`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
