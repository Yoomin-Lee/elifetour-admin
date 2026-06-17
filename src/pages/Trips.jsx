import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Map } from 'lucide-react'
import { getTrips, createTrip, deleteTrip } from '../lib/trips'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import TripForm from '../components/TripForm'
import { statusOptions } from '../config/site'

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

function nights(depart, ret) {
  if (!depart || !ret) return ''
  const n = Math.round((new Date(ret) - new Date(depart)) / 86400000)
  return `${n}박${n + 1}일`
}

export default function Trips() {
  const { user, canWrite } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTrips({ status: statusFilter || undefined, search: search || undefined })
      setTrips(data)
    } catch { setTrips([]) } finally { setLoading(false) }
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  async function handleCreate(form) {
    setSaving(true)
    try {
      const created = await createTrip(form, user?.id)
      setTrips((prev) => [created, ...prev])
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id, e) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('이 여행을 삭제하면 여행자 명단도 모두 삭제됩니다. 계속할까요?')) return
    await deleteTrip(id)
    setTrips((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">여행 일정</h1>
          <p className="text-sm text-slate-500 mt-0.5">전체 {trips.length}건</p>
        </div>
        {canWrite && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            여행 등록
          </button>
        )}
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        <input
          className="input max-w-xs"
          placeholder="여행명 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">전체 상태</option>
          {statusOptions.trip.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 여행 목록 */}
      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">불러오는 중...</div>
      ) : trips.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-slate-400">
          <Map className="h-10 w-10" />
          <p>등록된 여행이 없습니다</p>
          {canWrite && <button className="btn-primary" onClick={() => setShowForm(true)}>첫 여행 등록하기</button>}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              to={`/trips/${trip.id}`}
              className="card block p-5 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate group-hover:text-brand transition">{trip.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">{trip.destination}</p>
                </div>
                <StatusBadge type="trip" value={trip.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {formatDate(trip.depart_date)} ~ {formatDate(trip.return_date)}
                  {' '}
                  <span className="text-slate-400">({nights(trip.depart_date, trip.return_date)})</span>
                </span>
                <span className="text-slate-400">{trip.manager && `담당 ${trip.manager}`}</span>
              </div>
              {trip.max_pax > 0 && (
                <p className="mt-1 text-xs text-slate-400">최대 {trip.max_pax}명</p>
              )}
              {canWrite && (
                <button
                  className="mt-3 text-xs text-red-400 hover:text-red-600 hidden group-hover:block"
                  onClick={(e) => handleDelete(trip.id, e)}
                >
                  삭제
                </button>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* 등록 모달 */}
      {showForm && (
        <Modal title="새 여행 등록" onClose={() => setShowForm(false)}>
          <TripForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            loading={saving}
          />
        </Modal>
      )}
    </div>
  )
}
