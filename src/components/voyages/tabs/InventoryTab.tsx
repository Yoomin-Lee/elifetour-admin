import { useState, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Search, ChevronDown, ChevronRight, ExternalLink,
  Ship, Plane, ArrowUp, ArrowDown, ArrowUpDown,
  Pencil, Plus, Save, X, Loader2, Trash2,
} from 'lucide-react'
import { Building2 } from 'lucide-react'
import { YearSelect } from '@/components/ui/year-select'
import { FieldSelect } from '@/components/ui/field-select'
import {
  fetchVoyages,
  fetchAllCabinGrades,
  fetchAllHotels,
  saveCabinGrades,
  updateHotel,
  addHotel,
  deleteHotel,
} from '@/lib/queries/voyages'
import {
  fetchAllVoyageFlights,
  updateVoyageFlight,
  deleteVoyageFlight,
  type VoyageFlight,
} from '@/lib/queries/voyageFlights'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { getAirportTimezone } from '@/lib/utils/flightCalc'
import type { CabinGrade, Hotel } from '@/types/database'

// ── 날짜/가격 헬퍼 ───────────────────────────────────────────────────────────
function localDt(isoUtc: string, airportCode: string): string {
  try {
    const tz = getAirportTimezone(airportCode)
    const zoned = toZonedTime(new Date(isoUtc), tz)
    return format(zoned, 'MM/dd HH:mm')
  } catch {
    return isoUtc.slice(0, 16).replace('T', ' ')
  }
}

function formatPrice(price: number | null | undefined, currency: string): string {
  if (price == null) return '—'
  const sym: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥' }
  const prefix = sym[currency] ?? (currency + ' ')
  return prefix + price.toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
}

function calcCabinPrice(g: CabinGrade): number | null {
  const sum = (g.ccf ?? 0) + (g.nccf ?? 0) + (g.tax ?? 0) + (g.tip ?? 0)
  if (sum > 0) return sum
  return g.price_per_person
}

function groupByOccupancy(grades: CabinGrade[]): { occupancy: number; total: number; remaining: number }[] {
  const map = new Map<number, { total: number; reserved: number }>()
  grades.forEach(g => {
    if (g.occupancy == null) return
    const cur = map.get(g.occupancy) ?? { total: 0, reserved: 0 }
    cur.total += g.total
    cur.reserved += g.reserved
    map.set(g.occupancy, cur)
  })
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([occupancy, { total, reserved }]) => ({ occupancy, total, remaining: total - reserved }))
}

// ── 잔여율 Progress Bar ──────────────────────────────────────────────────────
function barColor(pct: number): string {
  if (pct >= 50) return 'bg-emerald-400'
  if (pct >= 20) return 'bg-amber-400'
  return 'bg-red-400'
}

function MiniProgressBar({ total, remaining, className = '' }: { total: number; remaining: number; className?: string }) {
  if (total === 0) return null
  const pct = Math.round((remaining / total) * 100)
  return (
    <div className={`h-1 w-full rounded-full bg-slate-200 overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── 상태 배지 ────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  '미오픈':   'bg-slate-100 text-slate-500',
  '판매중':   'bg-emerald-50 text-emerald-600',
  '마감':     'bg-red-50 text-red-500',
  '출발완료': 'bg-sky-50 text-sky-600',
  '취소':     'bg-slate-100 text-slate-400',
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null
  const cls = STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-500'
  return (
    <span className={`inline-block text-[10px] font-semibold px-1.5 py-px rounded-full leading-tight ${cls} ${status === '취소' ? 'line-through' : ''}`}>
      {status}
    </span>
  )
}

// ── 정렬 아이콘 ──────────────────────────────────────────────────────────────
type SortCol = 'departure_date' | 'remaining'

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol | null; sortDir: 'asc' | 'desc' }) {
  if (sortCol !== col) return <ArrowUpDown className="h-3 w-3 text-slate-300" />
  return sortDir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-brand" />
    : <ArrowDown className="h-3 w-3 text-brand" />
}

// ── 편집용 인풋 헬퍼 ─────────────────────────────────────────────────────────
function TxtInput({ value, onChange, placeholder = '', className = '' }: {
  value: string | null | undefined; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  return (
    <input type="text" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-1.5 py-0.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand ${className}`} />
  )
}

function NumInput({ value, onChange, className = '' }: {
  value: number | null | undefined; onChange: (v: number | null) => void; className?: string
}) {
  return (
    <input type="number" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className={`w-full px-1.5 py-0.5 border border-slate-200 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand ${className}`} />
  )
}

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-white">
      {['USD', 'KRW', 'EUR', 'SGD', 'JPY'].map(c => <option key={c}>{c}</option>)}
    </select>
  )
}

// ── Draft 타입 ───────────────────────────────────────────────────────────────
type DraftGrade = CabinGrade & { _isNew?: true }
type DraftHotel = Hotel      & { _isNew?: true }

// ── 보유 현황 서브 패널 ──────────────────────────────────────────────────────
function InventoryPanel({
  voyageId,
  grades: initGrades,
  flights: initFlights,
  hotels: initHotels,
}: {
  voyageId: string
  grades: CabinGrade[]
  flights: VoyageFlight[]
  hotels: Hotel[]
}) {
  const qc = useQueryClient()

  // 편집 상태
  const [editMode, setEditMode]       = useState(false)
  const [draftGrades, setDraftGrades] = useState<DraftGrade[]>([])
  const [delGradeIds, setDelGradeIds] = useState<string[]>([])
  const [draftFlights, setDraftFlights] = useState<VoyageFlight[]>([])
  const [delFlightIds, setDelFlightIds] = useState<string[]>([])
  const [draftHotels, setDraftHotels]   = useState<DraftHotel[]>([])
  const [delHotelIds, setDelHotelIds]   = useState<string[]>([])

  function startEdit() {
    setDraftGrades(initGrades.map(g => ({ ...g })))
    setDelGradeIds([])
    setDraftFlights(initFlights.map(f => ({ ...f })))
    setDelFlightIds([])
    setDraftHotels(initHotels.map(h => ({ ...h })))
    setDelHotelIds([])
    setEditMode(true)
  }
  function cancelEdit() { setEditMode(false) }

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['all-cabin-grades'] })
    qc.invalidateQueries({ queryKey: ['cabin-grades', voyageId] })
    qc.invalidateQueries({ queryKey: ['cabin-grades'] })
    qc.invalidateQueries({ queryKey: ['all-voyage-flights'] })
    qc.invalidateQueries({ queryKey: ['all-hotels'] })
    qc.invalidateQueries({ queryKey: ['voyages'] })
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      // 1. 캐빈 등급
      await saveCabinGrades(
        voyageId,
        draftGrades.map((g, i) => ({
          ...(g._isNew ? {} : { id: g.id }),
          grade: g.grade,
          total: g.total,
          reserved: g.reserved,
          price_per_person: g.price_per_person,
          ccf: g.ccf,
          nccf: g.nccf,
          tax: g.tax,
          tip: g.tip,
          currency: g.currency,
          agent: g.agent,
          sort_order: i,
        })),
        delGradeIds.filter(id => !id.startsWith('__new__')),
      )

      // 2. 항공 좌석·운임 (경로·시각 제외)
      await Promise.all([
        ...draftFlights
          .filter(f => !delFlightIds.includes(f.id))
          .map(f => updateVoyageFlight(f.id, {
            seats_group:    f.seats_group,
            seats_indivi:   f.seats_indivi,
            seats_business: f.seats_business,
            fare_base: f.fare_base,
            fare_fuel: f.fare_fuel,
            fare_tax:  f.fare_tax,
          })),
        ...delFlightIds.map(id => deleteVoyageFlight(id)),
      ])

      // 3. 호텔
      await Promise.all([
        ...delHotelIds.filter(id => !id.startsWith('__new__')).map(id => deleteHotel(id)),
        ...draftHotels.filter(h => h._isNew).map(h =>
          addHotel(voyageId, {
            hotel_name: h.hotel_name,
            stay_date:  h.stay_date,
            room_rate:  h.room_rate,
            currency:   h.currency,
            sort_order: h.sort_order,
          }),
        ),
        ...draftHotels.filter(h => !h._isNew).map(h =>
          updateHotel(h.id, {
            hotel_name: h.hotel_name,
            stay_date:  h.stay_date,
            room_rate:  h.room_rate,
            currency:   h.currency,
          }),
        ),
      ])
    },
    onSuccess: () => {
      invalidateAll()
      setEditMode(false)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  // ── 캐빈 등급 핸들러 ─────────────────────────────────────────────────────
  function setGrade(idx: number, patch: Partial<DraftGrade>) {
    setDraftGrades(prev => prev.map((g, i) => i === idx ? { ...g, ...patch } : g))
  }
  function addGradeRow() {
    setDraftGrades(prev => [...prev, {
      id: `__new__${Date.now()}`, voyage_id: voyageId,
      grade: '', occupancy: null, total: 0, reserved: 0, price_per_person: null,
      ccf: null, nccf: null, tax: null, tip: null,
      currency: 'USD', agent: null, sort_order: prev.length,
      created_at: '', _isNew: true,
    }])
  }
  function removeGradeRow(idx: number) {
    const g = draftGrades[idx]
    if (!g._isNew) setDelGradeIds(p => [...p, g.id])
    setDraftGrades(p => p.filter((_, i) => i !== idx))
  }

  // ── 항공편 핸들러 ────────────────────────────────────────────────────────
  function setFlight(idx: number, patch: Partial<VoyageFlight>) {
    setDraftFlights(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f))
  }
  function removeFlightRow(id: string) {
    setDelFlightIds(p => [...p, id])
    setDraftFlights(p => p.filter(f => f.id !== id))
  }

  // ── 호텔 핸들러 ──────────────────────────────────────────────────────────
  function setHotel(idx: number, patch: Partial<DraftHotel>) {
    setDraftHotels(prev => prev.map((h, i) => i === idx ? { ...h, ...patch } : h))
  }
  function addHotelRow() {
    setDraftHotels(prev => [...prev, {
      id: `__new__${Date.now()}`, voyage_id: voyageId,
      hotel_name: '', stay_date: '', room_rate: null,
      currency: 'USD', sort_order: prev.length,
      created_at: '', _isNew: true,
    }])
  }
  function removeHotelRow(idx: number) {
    const h = draftHotels[idx]
    if (!h._isNew) setDelHotelIds(p => [...p, h.id])
    setDraftHotels(p => p.filter((_, i) => i !== idx))
  }

  const isSaving = saveMut.isPending

  // ── 편집 패널 상단 컨트롤 ────────────────────────────────────────────────
  const EditBar = (
    <div className="flex items-center justify-end gap-2 px-5 py-2 border-b border-slate-200 bg-slate-50/80">
      {editMode ? (
        <>
          <button
            onClick={cancelEdit}
            disabled={isSaving}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-200 transition disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" />취소
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={isSaving}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-brand text-white hover:bg-brand-dark transition disabled:opacity-40"
          >
            {isSaving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Save className="h-3.5 w-3.5" />}
            저장
          </button>
        </>
      ) : (
        <button
          onClick={startEdit}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-200 transition"
        >
          <Pencil className="h-3.5 w-3.5" />편집
        </button>
      )}
    </div>
  )

  // ── 삭제 버튼 공통 ────────────────────────────────────────────────────────
  const DelBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )

  // ── 추가 버튼 공통 ────────────────────────────────────────────────────────
  const AddBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-brand transition"
    >
      <Plus className="h-3.5 w-3.5" />{label}
    </button>
  )

  const grades  = editMode ? draftGrades  : initGrades
  const flights = editMode ? draftFlights : initFlights
  const hotels  = editMode ? draftHotels  : initHotels

  return (
    <div className="bg-slate-50/70 border-t border-slate-200 divide-y divide-slate-200">
      {EditBar}

      {/* ── 크루즈 선실 ── */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Ship className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">크루즈 선실</span>
        </div>

        {grades.length === 0 && !editMode ? (
          <p className="text-xs text-slate-400">등록된 캐빈 등급이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: editMode ? 780 : 520 }}>
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-1.5 w-20 font-medium">등급</th>
                  <th className="text-right pb-1.5 w-14 font-medium">보유</th>
                  <th className="text-right pb-1.5 w-14 font-medium">예약</th>
                  <th className="text-right pb-1.5 w-16 font-medium">잔여</th>
                  <th className="text-left pb-1.5 pl-2 w-24 font-medium">에이전트</th>
                  <th className="text-right pb-1.5 w-16 font-medium">CCF</th>
                  <th className="text-right pb-1.5 w-16 font-medium">NCCF</th>
                  <th className="text-right pb-1.5 w-16 font-medium">TAX</th>
                  <th className="text-right pb-1.5 w-16 font-medium">TIP</th>
                  {editMode && <th className="text-left pb-1.5 pl-2 w-16 font-medium">통화</th>}
                  <th className="text-right pb-1.5 font-medium text-slate-500">캐빈가</th>
                  {editMode && <th className="pb-1.5 w-8" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(grades as DraftGrade[]).map((g, idx) => {
                  const remaining = g.total - g.reserved
                  return (
                    <tr key={g.id} className={editMode ? 'align-middle' : 'hover:bg-white/60 transition-colors'}>
                      <td className="py-1.5 pr-1">
                        {editMode
                          ? <TxtInput value={g.grade} onChange={v => setGrade(idx, { grade: v })} placeholder="등급명" />
                          : <span className="font-semibold text-slate-700">{g.grade}</span>}
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={g.total} onChange={v => setGrade(idx, { total: v ?? 0 })} />
                          : <span className="text-slate-600">{g.total}</span>}
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={g.reserved} onChange={v => setGrade(idx, { reserved: v ?? 0 })} />
                          : <span className="text-slate-600">{g.reserved}</span>}
                      </td>
                      <td className="py-1.5 text-right">
                        {editMode ? (
                          <span className={remaining < 0 ? 'text-red-500 font-semibold' : 'text-slate-500'}>{remaining}</span>
                        ) : (
                          <>
                            <span className={remaining === 0 && g.total > 0 ? 'text-red-500 font-semibold' : 'text-slate-700'}>{remaining}</span>
                            <MiniProgressBar total={g.total} remaining={remaining} className="mt-0.5" />
                          </>
                        )}
                      </td>
                      <td className="py-1.5 pl-2 pr-1">
                        {editMode
                          ? <TxtInput value={g.agent} onChange={v => setGrade(idx, { agent: v || null })} placeholder="에이전트" />
                          : <span className="text-slate-500">{g.agent ?? '—'}</span>}
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={g.ccf} onChange={v => setGrade(idx, { ccf: v })} />
                          : <span className="text-slate-500">{g.ccf != null ? g.ccf.toLocaleString() : '—'}</span>}
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={g.nccf} onChange={v => setGrade(idx, { nccf: v })} />
                          : <span className="text-slate-500">{g.nccf != null ? g.nccf.toLocaleString() : '—'}</span>}
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={g.tax} onChange={v => setGrade(idx, { tax: v })} />
                          : <span className="text-slate-500">{g.tax != null ? g.tax.toLocaleString() : '—'}</span>}
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={g.tip} onChange={v => setGrade(idx, { tip: v })} />
                          : <span className="text-slate-500">{g.tip != null ? g.tip.toLocaleString() : '—'}</span>}
                      </td>
                      {editMode && (
                        <td className="py-1.5 pl-2 pr-1">
                          <CurrencySelect value={g.currency} onChange={v => setGrade(idx, { currency: v })} />
                        </td>
                      )}
                      <td className="py-1.5 text-right pr-1">
                        {editMode
                          ? <NumInput value={g.price_per_person} onChange={v => setGrade(idx, { price_per_person: v })} />
                          : <span className="font-semibold text-brand">{formatPrice(calcCabinPrice(g), g.currency)}</span>}
                      </td>
                      {editMode && (
                        <td className="py-1.5 text-center">
                          <DelBtn onClick={() => removeGradeRow(idx)} />
                        </td>
                      )}
                    </tr>
                  )
                })}

                {/* 합계 행 (뷰 모드 다중 등급일 때) */}
                {!editMode && initGrades.length > 1 && (
                  <tr className="border-t border-slate-200 bg-slate-100/60">
                    <td className="py-1.5 text-[10px] text-slate-400 font-medium">합계</td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">{initGrades.reduce((s, g) => s + g.total, 0)}</td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">{initGrades.reduce((s, g) => s + g.reserved, 0)}</td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">{initGrades.reduce((s, g) => s + (g.total - g.reserved), 0)}</td>
                    <td colSpan={6} />
                  </tr>
                )}
              </tbody>
            </table>
            {editMode && <AddBtn label="등급 추가" onClick={addGradeRow} />}
          </div>
        )}
        {grades.length === 0 && editMode && (
          <AddBtn label="등급 추가" onClick={addGradeRow} />
        )}
      </div>

      {/* ── 항공 좌석 ── */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Plane className="h-3.5 w-3.5 text-sky-500" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">항공 좌석</span>
        </div>

        {flights.length === 0 ? (
          <p className="text-xs text-slate-400">등록된 항공편이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: editMode ? 700 : 580 }}>
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-1.5 w-16 font-medium">편명</th>
                  <th className="text-left pb-1.5 font-medium">구간</th>
                  <th className="text-right pb-1.5 w-14 font-medium">그룹</th>
                  <th className="text-right pb-1.5 w-14 font-medium">인디비</th>
                  <th className="text-right pb-1.5 w-16 font-medium">비즈니스</th>
                  <th className="text-right pb-1.5 w-16 font-medium text-slate-500">총 좌석</th>
                  <th className="text-right pb-1.5 w-24 font-medium">운임</th>
                  <th className="text-right pb-1.5 w-24 font-medium">유류할증</th>
                  <th className="text-right pb-1.5 w-20 font-medium">발권피</th>
                  <th className="text-right pb-1.5 w-24 font-medium text-slate-500">항공료</th>
                  {editMode && <th className="pb-1.5 w-8" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flights.map((f, idx) => {
                  const totalSeats = (f.seats_group ?? 0) + (f.seats_indivi ?? 0) + (f.seats_business ?? 0)
                  const totalFare  = (f.fare_base ?? 0) + (f.fare_fuel ?? 0) + (f.fare_tax ?? 0)
                  const depLocal   = localDt(f.dep_datetime, f.dep_airport)
                  const arrLocal   = localDt(f.arr_datetime, f.arr_airport)
                  return (
                    <tr key={f.id} className={editMode ? 'align-middle' : 'hover:bg-white/60 transition-colors'}>
                      <td className="py-1.5 font-mono font-semibold text-slate-700">{f.flight_num}</td>
                      <td className="py-1.5 text-slate-500 text-[10px]">
                        <span className="font-medium text-slate-600">{f.dep_airport}</span>
                        <span className="text-slate-300 mx-0.5">→</span>
                        <span className="font-medium text-slate-600">{f.arr_airport}</span>
                        <span className="ml-1 text-slate-300">{depLocal} ~ {arrLocal}</span>
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={f.seats_group} onChange={v => setFlight(idx, { seats_group: v ?? 0 })} />
                          : <span className="text-slate-600">{f.seats_group ?? 0}</span>}
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={f.seats_indivi} onChange={v => setFlight(idx, { seats_indivi: v ?? 0 })} />
                          : <span className="text-slate-600">{f.seats_indivi ?? 0}</span>}
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={f.seats_business} onChange={v => setFlight(idx, { seats_business: v ?? 0 })} />
                          : <span className="text-slate-600">{f.seats_business ?? 0}</span>}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-slate-700">{totalSeats || '—'}</td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={f.fare_base} onChange={v => setFlight(idx, { fare_base: v ?? 0 })} />
                          : <span className="text-slate-500">{f.fare_base ? f.fare_base.toLocaleString('ko-KR') + '원' : '—'}</span>}
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={f.fare_fuel} onChange={v => setFlight(idx, { fare_fuel: v ?? 0 })} />
                          : <span className="text-slate-500">{f.fare_fuel ? f.fare_fuel.toLocaleString('ko-KR') + '원' : '—'}</span>}
                      </td>
                      <td className="py-1.5 pr-1 text-right">
                        {editMode
                          ? <NumInput value={f.fare_tax} onChange={v => setFlight(idx, { fare_tax: v ?? 0 })} />
                          : <span className="text-slate-500">{f.fare_tax ? f.fare_tax.toLocaleString('ko-KR') + '원' : '—'}</span>}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-brand">
                        {totalFare > 0 ? totalFare.toLocaleString('ko-KR') + '원'
                          : f.flight_fare ? formatPrice(f.flight_fare, f.currency_code) : '—'}
                      </td>
                      {editMode && (
                        <td className="py-1.5 text-center">
                          <DelBtn onClick={() => removeFlightRow(f.id)} />
                        </td>
                      )}
                    </tr>
                  )
                })}
                {!editMode && initFlights.length > 1 && (
                  <tr className="border-t border-slate-200 bg-slate-100/60">
                    <td className="py-1.5 text-[10px] text-slate-400 font-medium">합계</td>
                    <td className="py-1.5" />
                    <td className="py-1.5 text-right font-semibold text-slate-700">{initFlights.reduce((s, f) => s + (f.seats_group ?? 0), 0)}</td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">{initFlights.reduce((s, f) => s + (f.seats_indivi ?? 0), 0)}</td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">{initFlights.reduce((s, f) => s + (f.seats_business ?? 0), 0)}</td>
                    <td className="py-1.5 text-right font-semibold text-brand">
                      {initFlights.reduce((s, f) => s + (f.seats_group ?? 0) + (f.seats_indivi ?? 0) + (f.seats_business ?? 0), 0) || '—'}
                    </td>
                    <td colSpan={4} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 호텔 객실 ── */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Building2 className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">호텔 객실</span>
        </div>

        {hotels.length === 0 && !editMode ? (
          <p className="text-xs text-slate-400">등록된 호텔이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: editMode ? 480 : 380 }}>
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-1.5 font-medium">호텔명</th>
                  <th className="text-left pb-1.5 w-28 font-medium">투숙일</th>
                  {editMode && <th className="text-left pb-1.5 w-16 font-medium">통화</th>}
                  <th className="text-right pb-1.5 w-28 font-medium">요금</th>
                  {editMode && <th className="pb-1.5 w-8" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(hotels as DraftHotel[]).map((h, idx) => (
                  <tr key={h.id} className={editMode ? 'align-middle' : 'hover:bg-white/60 transition-colors'}>
                    <td className="py-1.5 pr-1">
                      {editMode
                        ? <TxtInput value={h.hotel_name} onChange={v => setHotel(idx, { hotel_name: v })} placeholder="호텔명" />
                        : <span className="font-medium text-slate-700">{h.hotel_name}</span>}
                    </td>
                    <td className="py-1.5 pr-1">
                      {editMode
                        ? <input type="date" value={h.stay_date} onChange={e => setHotel(idx, { stay_date: e.target.value })}
                            className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand" />
                        : <span className="text-slate-500">{formatDate(h.stay_date)}</span>}
                    </td>
                    {editMode && (
                      <td className="py-1.5 pr-1">
                        <CurrencySelect value={h.currency} onChange={v => setHotel(idx, { currency: v })} />
                      </td>
                    )}
                    <td className="py-1.5 text-right pr-1">
                      {editMode
                        ? <NumInput value={h.room_rate} onChange={v => setHotel(idx, { room_rate: v })} />
                        : <span className="text-slate-600">{formatPrice(h.room_rate, h.currency)}</span>}
                    </td>
                    {editMode && (
                      <td className="py-1.5 text-center">
                        <DelBtn onClick={() => removeHotelRow(idx)} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {editMode && <AddBtn label="호텔 추가" onClick={addHotelRow} />}
          </div>
        )}
        {hotels.length === 0 && editMode && (
          <AddBtn label="호텔 추가" onClick={addHotelRow} />
        )}
      </div>
    </div>
  )
}

// ── 메인 InventoryTab ────────────────────────────────────────────────────────
export default function InventoryTab() {
  const navigate = useNavigate()
  const [filter, setFilter]             = useState('')
  const [yearFilter, setYearFilter]     = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [remainFilter, setRemainFilter] = useState<string>('ALL')
  const [sortCol, setSortCol]           = useState<SortCol | null>(null)
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc')
  const [expandedId, setExpandedId]     = useState<string | null>(null)

  const { data: voyages = [], isLoading } = useQuery({ queryKey: ['voyages'], queryFn: fetchVoyages })
  const { data: allGrades = [] }  = useQuery({ queryKey: ['all-cabin-grades'],    queryFn: fetchAllCabinGrades })
  const { data: allFlights = [] } = useQuery({ queryKey: ['all-voyage-flights'],  queryFn: fetchAllVoyageFlights })
  const { data: allHotels = [] }  = useQuery({ queryKey: ['all-hotels'],          queryFn: fetchAllHotels })

  const gradeMap = useMemo(() => {
    const map: Record<string, CabinGrade[]> = {}
    allGrades.forEach(g => { if (!map[g.voyage_id]) map[g.voyage_id] = []; map[g.voyage_id].push(g) })
    return map
  }, [allGrades])

  const flightMap = useMemo(() => {
    const map: Record<string, VoyageFlight[]> = {}
    allFlights.forEach(f => { if (!map[f.voyage_id]) map[f.voyage_id] = []; map[f.voyage_id].push(f) })
    return map
  }, [allFlights])

  const hotelMap = useMemo(() => {
    const map: Record<string, Hotel[]> = {}
    allHotels.forEach(h => { if (!map[h.voyage_id]) map[h.voyage_id] = []; map[h.voyage_id].push(h) })
    return map
  }, [allHotels])

  const years = useMemo(() => {
    const ys = new Set<string>()
    voyages.forEach(v => { if (v.departure_date) ys.add(v.departure_date.slice(0, 4)) })
    return Array.from(ys).sort().reverse()
  }, [voyages])

  const voyageRows = useMemo(() => voyages.map(v => {
    const grades  = gradeMap[v.id]  ?? []
    const flights = flightMap[v.id] ?? []
    const hotels  = hotelMap[v.id]  ?? []
    const totalCabin     = grades.length > 0 ? grades.reduce((s, g) => s + g.total, 0) : (v.cabin_total ?? 0)
    const remainingCabin = grades.length > 0 ? grades.reduce((s, g) => s + (g.total - g.reserved), 0) : (v.cabin_remaining ?? 0)
    const totalSeats     = flights.reduce((s, f) => s + (f.seats_group ?? 0) + (f.seats_indivi ?? 0) + (f.seats_business ?? 0), 0)
    const occGroups      = groupByOccupancy(grades)
    return { v, grades, flights, hotels, totalCabin, remainingCabin, totalSeats, occGroups }
  }), [voyages, gradeMap, flightMap, hotelMap])

  const filtered = useMemo(() => {
    let rows = voyageRows.filter(({ v, remainingCabin, totalCabin, hotels }) => {
      if (yearFilter !== 'ALL' && !v.departure_date?.startsWith(yearFilter)) return false
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false
      if (remainFilter !== 'ALL') {
        if (remainFilter === '마감'    && !(remainingCabin === 0 && totalCabin > 0))     return false
        if (remainFilter === '마감임박' && !(remainingCabin >= 1 && remainingCabin <= 3)) return false
        if (remainFilter === '여유있음' && remainingCabin < 4)                            return false
      }
      if (!filter) return true
      const q = filter.toLowerCase()
      return (
        voyageTitle(v).toLowerCase().includes(q) ||
        (v.ship_name   ?? '').toLowerCase().includes(q) ||
        (v.cruise_line ?? '').toLowerCase().includes(q) ||
        (v.airline     ?? '').toLowerCase().includes(q) ||
        hotels.some(h => h.hotel_name.toLowerCase().includes(q))
      )
    })
    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        let cmp = 0
        if (sortCol === 'departure_date') cmp = (a.v.departure_date ?? '').localeCompare(b.v.departure_date ?? '')
        else if (sortCol === 'remaining') cmp = a.remainingCabin - b.remainingCabin
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return rows
  }, [voyageRows, yearFilter, statusFilter, remainFilter, filter, sortCol, sortDir])

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }
  function toggleExpand(id: string) { setExpandedId(prev => prev === id ? null : id) }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">보유 현황</h1>
          <p className="text-sm text-slate-400">행사별 크루즈·항공·호텔 보유 현황 — ▶ 클릭으로 상세 확인 및 편집</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <YearSelect value={yearFilter} years={years} onChange={setYearFilter} />
          <FieldSelect
            value={statusFilter}
            options={[{ value: 'ALL', label: '전체 상태' }, '미오픈', '판매중', '마감', '출발완료', '취소']}
            onChange={setStatusFilter}
            className="h-8 text-sm w-28"
          />
          <FieldSelect
            value={remainFilter}
            options={[
              { value: 'ALL',    label: '전체 잔여'      },
              { value: '여유있음', label: '여유있음 (4+)'  },
              { value: '마감임박', label: '마감임박 (1-3)' },
              { value: '마감',    label: '마감 (0개)'    },
            ]}
            onChange={setRemainFilter}
            className="h-8 text-sm w-32"
          />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="행사·선박·항공·호텔 검색"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[920px] w-full text-xs table-fixed">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-2 py-2.5 w-8" />
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
              <th
                className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20 cursor-pointer select-none hover:text-slate-700 transition"
                onClick={() => toggleSort('departure_date')}
              >
                <div className="flex items-center gap-1">출발일 <SortIcon col="departure_date" sortCol={sortCol} sortDir={sortDir} /></div>
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">
                <div className="flex items-center gap-1"><Ship className="h-3 w-3 text-blue-400" />크루즈</div>
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">
                <div className="flex items-center gap-1"><Plane className="h-3 w-3 text-sky-400" />항공</div>
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">
                <div className="flex items-center gap-1"><Building2 className="h-3 w-3 text-amber-400" />호텔</div>
              </th>
              <th className="px-2 py-2.5 text-right font-semibold text-slate-500 w-14 whitespace-nowrap">보유캐빈</th>
              <th
                className="px-2 py-2.5 text-right font-semibold text-slate-500 w-20 whitespace-nowrap cursor-pointer select-none hover:text-slate-700 transition"
                onClick={() => toggleSort('remaining')}
              >
                <div className="flex items-center justify-end gap-1">잔여캐빈 <SortIcon col="remaining" sortCol={sortCol} sortDir={sortDir} /></div>
              </th>
              <th className="px-2 py-2.5 text-right font-semibold text-slate-500 w-14 whitespace-nowrap">보유좌석</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
            )}
            {filtered.map(({ v, grades, flights, hotels, totalCabin, remainingCabin, totalSeats, occGroups }) => {
              const firstHotelName = hotels[0]?.hotel_name ?? null
              const hotelDisplay   = hotels.length > 1 ? `${firstHotelName} 외 ${hotels.length - 1}곳` : firstHotelName
              const airlineLabel   = [v.airline, v.airline_return].filter(Boolean).join(' / ') || null
              const isCancelled    = v.status === '취소'
              const isExpanded     = expandedId === v.id

              return (
                <Fragment key={v.id}>
                  <tr className={['border-b border-slate-100 hover:bg-slate-50 transition-colors', isCancelled ? 'opacity-50' : '', isExpanded ? 'bg-slate-50' : ''].join(' ')}>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => toggleExpand(v.id)} className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-100 transition" title="상세 확인 및 편집">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </td>

                    {/* 행사명 + 상태 배지 */}
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        <StatusBadge status={v.status} />
                        {isCancelled ? (
                          <span className="line-through text-slate-400">{voyageTitle(v)}</span>
                        ) : (
                          <button
                            onClick={() => navigate(`/voyages?tab=항차검색&voyage=${v.id}`)}
                            className="group flex items-center gap-1 font-medium text-slate-800 hover:text-brand transition text-left"
                          >
                            <span className="truncate">{voyageTitle(v)}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition flex-shrink-0" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(v.departure_date)}</td>

                    {/* 크루즈 + n인실별·등급별 잔여 뱃지 */}
                    <td className="px-3 py-2">
                      <div className="text-slate-600 truncate">{v.ship_name ?? v.cruise_line ?? '—'}</div>
                      {occGroups.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {occGroups.map(o => (
                            <span key={o.occupancy} className={`text-[10px] font-medium px-1.5 py-px rounded-full border leading-tight ${o.remaining === 0 && o.total > 0 ? 'bg-red-50 text-red-500 border-red-200' : 'bg-brand/5 text-brand border-brand/20'}`}>
                              {o.occupancy}인실 {o.remaining}
                            </span>
                          ))}
                        </div>
                      )}
                      {grades.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {grades.map(g => {
                            const rem = g.total - g.reserved
                            return (
                              <span key={g.id} className={`text-[10px] font-medium px-1.5 py-px rounded-full border leading-tight ${rem === 0 && g.total > 0 ? 'bg-red-50 text-red-500 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                {g.grade} {rem}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2 text-slate-600 truncate">{airlineLabel ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600 truncate">{hotelDisplay ?? '—'}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{totalCabin || '—'}</td>

                    {/* 잔여캐빈 + 프로그레스바 */}
                    <td className="px-2 py-2 text-right">
                      <span className={remainingCabin === 0 && totalCabin > 0 ? 'text-red-500 font-semibold' : 'text-slate-700'}>
                        {totalCabin > 0 ? remainingCabin : '—'}
                      </span>
                      {totalCabin > 0 && <MiniProgressBar total={totalCabin} remaining={remainingCabin} className="mt-0.5" />}
                    </td>

                    <td className="px-2 py-2 text-right text-slate-700">{totalSeats || '—'}</td>
                  </tr>

                  {isExpanded && (
                    <tr className="border-b border-slate-200">
                      <td colSpan={9} className="p-0">
                        <InventoryPanel
                          voyageId={v.id}
                          grades={grades}
                          flights={flights}
                          hotels={hotels}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
