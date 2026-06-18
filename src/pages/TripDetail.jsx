import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Phone, BookOpen, BedDouble, Banknote, AlertTriangle, ChevronDown } from 'lucide-react'
import { getTripById, updateTrip, deleteTrip } from '../lib/trips'
import { getPassengers, createPassenger, updatePassenger, deletePassenger } from '../lib/passengers'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import TripForm from '../components/TripForm'
import PassengerForm from '../components/PassengerForm'
import { statusOptions } from '../config/site'
import { useAuth } from '../context/AuthContext'

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatMoney(n) {
  if (!n && n !== 0) return '-'
  return Number(n).toLocaleString('ko-KR') + '원'
}

function nights(a, b) {
  if (!a || !b) return ''
  const n = Math.round((new Date(b) - new Date(a)) / 86400000)
  return `${n}박${n + 1}일`
}

export default function TripDetail() {
  const { canWrite } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [passengers, setPassengers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditTrip, setShowEditTrip] = useState(false)
  const [showAddPax, setShowAddPax] = useState(false)
  const [editingPax, setEditingPax] = useState(null)
  const [saving, setSaving] = useState(false)
  const [paxSearch, setPaxSearch] = useState('')
  const [updatingBooking, setUpdatingBooking] = useState(null)

  const load = useCallback(async () => {
    try {
      const [t, pax] = await Promise.all([getTripById(id), getPassengers(id)])
      setTrip(t)
      setPassengers(pax)
    } catch { navigate('/trips') } finally { setLoading(false) }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  async function handleUpdateTrip(form) {
    setSaving(true)
    try {
      const updated = await updateTrip(id, form)
      setTrip(updated)
      setShowEditTrip(false)
    } finally { setSaving(false) }
  }

  async function handleDeleteTrip() {
    if (!confirm('여행을 삭제하면 여행자 명단도 모두 삭제됩니다. 계속할까요?')) return
    await deleteTrip(id)
    navigate('/trips')
  }

  async function handleAddPax(form) {
    setSaving(true)
    try {
      const created = await createPassenger({ ...form, trip_id: id })
      setPassengers((p) => [...p, created])
      setShowAddPax(false)
    } finally { setSaving(false) }
  }

  async function handleUpdatePax(form) {
    setSaving(true)
    try {
      const updated = await updatePassenger(editingPax.id, form)
      setPassengers((p) => p.map((x) => x.id === updated.id ? updated : x))
      setEditingPax(null)
    } finally { setSaving(false) }
  }

  async function handleDeletePax(paxId) {
    if (!confirm('이 여행자를 삭제할까요?')) return
    await deletePassenger(paxId)
    setPassengers((p) => p.filter((x) => x.id !== paxId))
  }

  async function handleBookingStatus(paxId, newStatus) {
    setUpdatingBooking(paxId)
    try {
      const updated = await updatePassenger(paxId, { booking_status: newStatus })
      setPassengers((p) => p.map((x) => x.id === updated.id ? updated : x))
    } finally {
      setUpdatingBooking(null)
    }
  }

  const BOOKING_LABEL = { inquiry: '문의', confirmed: '계약', balance: '잔금', passport: '여권', departed: '출발' }

  function exportCSV() {
    const headers = ['순번', '성명', '생년월일', '성별', '연락처', '여권번호', '여권만료일', '국적', '객실', '예약단계', '결제상태', '입금액', '특이사항', '메모']
    const rows = filtered.map((p, i) => [
      i + 1, p.name, p.birth_date || '', p.gender === 'M' ? '남' : p.gender === 'F' ? '여' : '',
      p.phone || '', p.passport_no || '', p.passport_expire || '', p.nationality || '',
      p.room_type === 'single' ? '1인실' : p.room_type === 'triple' ? '3인실' : '2인실',
      BOOKING_LABEL[p.booking_status] || '문의',
      p.payment_status === 'paid' ? '완납' : p.payment_status === 'partial' ? '일부납' : '미납',
      p.payment_amount || 0, p.special_request || '', p.notes || ''
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${trip?.title || '명단'}_여행자명단.csv`
    a.click()
  }

  const filtered = passengers.filter((p) =>
    !paxSearch || p.name.includes(paxSearch) || (p.phone || '').includes(paxSearch) || (p.passport_no || '').includes(paxSearch)
  )

  const paidCount = passengers.filter((p) => p.payment_status === 'paid').length
  const partialCount = passengers.filter((p) => p.payment_status === 'partial').length
  const bookingCounts = statusOptions.booking.map((o) => ({
    ...o,
    count: passengers.filter((p) => (p.booking_status || 'inquiry') === o.value).length,
  }))

  if (loading) return (
    <div className="flex justify-center py-20 text-slate-400">불러오는 중...</div>
  )

  return (
    <div className="space-y-5">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/trips" className="hover:text-brand">여행 일정</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{trip?.title}</span>
      </div>

      {/* 여행 정보 카드 */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800">{trip?.title}</h1>
              <StatusBadge type="trip" value={trip?.status} />
            </div>
            <p className="text-slate-500">{trip?.destination}</p>
          </div>
          {canWrite && (
            <div className="flex gap-2">
              <button className="btn-secondary text-sm" onClick={() => setShowEditTrip(true)}>수정</button>
              <button className="btn-danger text-sm" onClick={handleDeleteTrip}>삭제</button>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <p className="label">출발일</p>
            <p className="font-medium">{formatDate(trip?.depart_date)}</p>
          </div>
          <div>
            <p className="label">귀국일</p>
            <p className="font-medium">{formatDate(trip?.return_date)} <span className="text-slate-400 text-xs">({nights(trip?.depart_date, trip?.return_date)})</span></p>
          </div>
          <div>
            <p className="label">인원</p>
            <p className="font-medium">{passengers.length}명 {trip?.max_pax > 0 && <span className="text-slate-400">/ 최대 {trip.max_pax}명</span>}</p>
          </div>
          <div>
            <p className="label">1인 요금</p>
            <p className="font-medium">{trip?.price_per_person ? formatMoney(trip.price_per_person) : '-'}</p>
          </div>
          {trip?.manager && (
            <div>
              <p className="label">담당자</p>
              <p className="font-medium">{trip.manager}</p>
            </div>
          )}
          {trip?.notes && (
            <div className="col-span-2 sm:col-span-4">
              <p className="label">메모</p>
              <p className="text-slate-600 whitespace-pre-wrap">{trip.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* 여행자 명단 */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-800">여행자 명단</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              총 {passengers.length}명 · 완납 {paidCount}명 · 일부납 {partialCount}명 · 미납 {passengers.length - paidCount - partialCount}명
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {bookingCounts.map((o) => (
                <span key={o.value} className="text-xs text-slate-400">
                  {o.label} <span className="font-medium text-slate-600">{o.count}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={exportCSV}>CSV 내보내기</button>
            {canWrite && (
              <button className="btn-primary text-sm" onClick={() => setShowAddPax(true)}>+ 여행자 추가</button>
            )}
          </div>
        </div>

        {/* 검색 */}
        <div className="px-5 py-3 border-b border-slate-50">
          <input
            className="input max-w-xs text-sm"
            placeholder="이름·연락처·여권번호 검색"
            value={paxSearch}
            onChange={(e) => setPaxSearch(e.target.value)}
          />
        </div>

        {/* 테이블 - 데스크탑 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-2.5 text-left font-medium w-8">#</th>
                <th className="px-4 py-2.5 text-left font-medium">성명</th>
                <th className="px-4 py-2.5 text-left font-medium">생년월일</th>
                <th className="px-4 py-2.5 text-left font-medium">성별</th>
                <th className="px-4 py-2.5 text-left font-medium">연락처</th>
                <th className="px-4 py-2.5 text-left font-medium">여권번호</th>
                <th className="px-4 py-2.5 text-left font-medium">만료일</th>
                <th className="px-4 py-2.5 text-left font-medium">객실</th>
                <th className="px-4 py-2.5 text-left font-medium">예약단계</th>
                <th className="px-4 py-2.5 text-left font-medium">결제</th>
                <th className="px-4 py-2.5 text-left font-medium">입금액</th>
                <th className="px-4 py-2.5 text-left font-medium">특이사항</th>
                <th className="px-4 py-2.5 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-slate-400">
                    {paxSearch ? '검색 결과 없음' : '등록된 여행자가 없습니다'}
                  </td>
                </tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{p.birth_date || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{p.gender === 'M' ? '남' : p.gender === 'F' ? '여' : '-'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{p.phone || '-'}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{p.passport_no || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{p.passport_expire || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {p.room_type === 'single' ? '1인실' : p.room_type === 'triple' ? '3인실' : '2인실'}
                  </td>
                  <td className="px-4 py-2.5">
                    {canWrite ? (
                      <div className="relative inline-block">
                        <select
                          value={p.booking_status || 'inquiry'}
                          onChange={(e) => handleBookingStatus(p.id, e.target.value)}
                          disabled={updatingBooking === p.id}
                          className="text-xs rounded px-1.5 py-0.5 pr-5 border border-slate-200 bg-white cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
                        >
                          {statusOptions.booking.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                      </div>
                    ) : (
                      <StatusBadge type="booking" value={p.booking_status || 'inquiry'} />
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge type="payment" value={p.payment_status} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{p.payment_amount ? formatMoney(p.payment_amount) : '-'}</td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-[120px] truncate">{p.special_request || '-'}</td>
                  <td className="px-4 py-2.5 text-right">
                    {canWrite && (
                      <div className="flex justify-end gap-2">
                        <button className="text-xs text-brand hover:underline" onClick={() => setEditingPax(p)}>수정</button>
                        <button className="text-xs text-red-400 hover:text-red-600" onClick={() => handleDeletePax(p.id)}>삭제</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 카드 - 모바일 */}
        <div className="md:hidden divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              {paxSearch ? '검색 결과 없음' : '등록된 여행자가 없습니다'}
            </div>
          ) : filtered.map((p, i) => (
            <div key={p.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs text-slate-400 mr-2">#{i + 1}</span>
                  <span className="font-semibold text-slate-800">{p.name}</span>
                  <span className="ml-2 text-xs text-slate-400">{p.gender === 'M' ? '남' : p.gender === 'F' ? '여' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge type="booking" value={p.booking_status || 'inquiry'} />
                  <StatusBadge type="payment" value={p.payment_status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{p.phone || '-'}</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3 shrink-0" />{p.passport_no || '-'}</span>
                <span className="flex items-center gap-1"><BedDouble className="h-3 w-3 shrink-0" />{p.room_type === 'single' ? '1인실' : p.room_type === 'triple' ? '3인실' : '2인실'}</span>
                <span className="flex items-center gap-1"><Banknote className="h-3 w-3 shrink-0" />{p.payment_amount ? formatMoney(p.payment_amount) : '미입금'}</span>
                {p.special_request && <span className="col-span-2 flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3 w-3 shrink-0" />{p.special_request}</span>}
              </div>
              {canWrite && (
                <div className="flex gap-3 mt-3">
                  <button className="text-xs text-brand font-medium" onClick={() => setEditingPax(p)}>수정</button>
                  <button className="text-xs text-red-400 font-medium" onClick={() => handleDeletePax(p.id)}>삭제</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 여행 수정 모달 */}
      {showEditTrip && (
        <Modal title="여행 정보 수정" onClose={() => setShowEditTrip(false)} wide>
          <TripForm
            initial={trip}
            onSubmit={handleUpdateTrip}
            onCancel={() => setShowEditTrip(false)}
            loading={saving}
          />
        </Modal>
      )}

      {/* 여행자 추가 모달 */}
      {showAddPax && (
        <Modal title="여행자 추가" onClose={() => setShowAddPax(false)}>
          <PassengerForm
            onSubmit={handleAddPax}
            onCancel={() => setShowAddPax(false)}
            loading={saving}
          />
        </Modal>
      )}

      {/* 여행자 수정 모달 */}
      {editingPax && (
        <Modal title="여행자 정보 수정" onClose={() => setEditingPax(null)}>
          <PassengerForm
            initial={editingPax}
            onSubmit={handleUpdatePax}
            onCancel={() => setEditingPax(null)}
            loading={saving}
          />
        </Modal>
      )}
    </div>
  )
}
