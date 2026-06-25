import { useState, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronDown, ChevronRight, ExternalLink, Ship, Plane } from 'lucide-react'
import { Building2 } from 'lucide-react'
import { YearSelect } from '@/components/ui/year-select'
import { FieldSelect } from '@/components/ui/field-select'
import { fetchVoyages, fetchAllCabinGrades, fetchAllHotels } from '@/lib/queries/voyages'
import { fetchAllVoyageFlights } from '@/lib/queries/voyageFlights'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { getAirportTimezone } from '@/lib/utils/flightCalc'
import type { CabinGrade, Hotel } from '@/types/database'
import type { VoyageFlight } from '@/lib/queries/voyageFlights'

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

// ── 보유 현황 서브 패널 ────────────────────────────────────────────────────
function InventoryPanel({
  grades,
  flights,
  hotels,
}: {
  grades: CabinGrade[]
  flights: VoyageFlight[]
  hotels: Hotel[]
}) {
  return (
    <div className="bg-slate-50/70 border-t border-slate-200 divide-y divide-slate-200">

      {/* ── 크루즈 선실 ── */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Ship className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">크루즈 선실</span>
        </div>
        {grades.length === 0 ? (
          <p className="text-xs text-slate-400">등록된 캐빈 등급이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-1.5 w-16 font-medium">등급</th>
                  <th className="text-right pb-1.5 w-12 font-medium">보유</th>
                  <th className="text-right pb-1.5 w-12 font-medium">예약</th>
                  <th className="text-right pb-1.5 w-12 font-medium">잔여</th>
                  <th className="text-left pb-1.5 pl-4 font-medium">에이전트</th>
                  <th className="text-right pb-1.5 font-medium">CCF</th>
                  <th className="text-right pb-1.5 font-medium">NCCF</th>
                  <th className="text-right pb-1.5 font-medium">TAX</th>
                  <th className="text-right pb-1.5 font-medium">TIP</th>
                  <th className="text-right pb-1.5 font-medium text-slate-500">캐빈가</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grades.map(g => {
                  const remaining = g.total - g.reserved
                  return (
                    <tr key={g.id} className="hover:bg-white/60 transition-colors">
                      <td className="py-1.5 font-semibold text-slate-700">{g.grade}</td>
                      <td className="py-1.5 text-right text-slate-600">{g.total}</td>
                      <td className="py-1.5 text-right text-slate-600">{g.reserved}</td>
                      <td className="py-1.5 text-right">
                        <span className={remaining === 0 && g.total > 0 ? 'text-red-500 font-semibold' : 'text-slate-700'}>
                          {remaining}
                        </span>
                      </td>
                      <td className="py-1.5 pl-4 text-slate-500">{g.agent ?? '—'}</td>
                      <td className="py-1.5 text-right text-slate-500">{g.ccf != null ? g.ccf.toLocaleString() : '—'}</td>
                      <td className="py-1.5 text-right text-slate-500">{g.nccf != null ? g.nccf.toLocaleString() : '—'}</td>
                      <td className="py-1.5 text-right text-slate-500">{g.tax != null ? g.tax.toLocaleString() : '—'}</td>
                      <td className="py-1.5 text-right text-slate-500">{g.tip != null ? g.tip.toLocaleString() : '—'}</td>
                      <td className="py-1.5 text-right font-semibold text-brand">
                        {formatPrice(calcCabinPrice(g), g.currency)}
                      </td>
                    </tr>
                  )
                })}
                {/* 합계 행 */}
                {grades.length > 1 && (
                  <tr className="border-t border-slate-200 bg-slate-100/60">
                    <td className="py-1.5 text-[10px] text-slate-400 font-medium">합계</td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">
                      {grades.reduce((s, g) => s + g.total, 0)}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">
                      {grades.reduce((s, g) => s + g.reserved, 0)}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">
                      {grades.reduce((s, g) => s + (g.total - g.reserved), 0)}
                    </td>
                    <td colSpan={6} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
            <table className="min-w-[580px] w-full text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-1.5 w-16 font-medium">편명</th>
                  <th className="text-left pb-1.5 font-medium">구간</th>
                  <th className="text-right pb-1.5 w-12 font-medium">그룹</th>
                  <th className="text-right pb-1.5 w-12 font-medium">인디비</th>
                  <th className="text-right pb-1.5 w-16 font-medium">비즈니스</th>
                  <th className="text-right pb-1.5 w-14 font-medium text-slate-500">총 좌석</th>
                  <th className="text-right pb-1.5 w-24 font-medium">운임</th>
                  <th className="text-right pb-1.5 w-24 font-medium">유류할증</th>
                  <th className="text-right pb-1.5 w-20 font-medium">발권피</th>
                  <th className="text-right pb-1.5 w-24 font-medium text-slate-500">항공료</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flights.map(f => {
                  const totalSeats = (f.seats_group ?? 0) + (f.seats_indivi ?? 0) + (f.seats_business ?? 0)
                  const totalFare  = (f.fare_base ?? 0) + (f.fare_fuel ?? 0) + (f.fare_tax ?? 0)
                  const depLocal   = localDt(f.dep_datetime, f.dep_airport)
                  const arrLocal   = localDt(f.arr_datetime, f.arr_airport)
                  return (
                    <tr key={f.id} className="hover:bg-white/60 transition-colors">
                      <td className="py-1.5 font-mono font-semibold text-slate-700">{f.flight_num}</td>
                      <td className="py-1.5 text-slate-500">
                        <span className="font-medium text-slate-600">{f.dep_airport}</span>
                        <span className="text-slate-300 mx-0.5">→</span>
                        <span className="font-medium text-slate-600">{f.arr_airport}</span>
                        <span className="ml-1.5 text-slate-300">
                          {depLocal} ~ {arrLocal}
                        </span>
                      </td>
                      <td className="py-1.5 text-right text-slate-600">{f.seats_group ?? 0}</td>
                      <td className="py-1.5 text-right text-slate-600">{f.seats_indivi ?? 0}</td>
                      <td className="py-1.5 text-right text-slate-600">{f.seats_business ?? 0}</td>
                      <td className="py-1.5 text-right font-semibold text-slate-700">{totalSeats || '—'}</td>
                      <td className="py-1.5 text-right text-slate-500">
                        {f.fare_base ? f.fare_base.toLocaleString('ko-KR') + '원' : '—'}
                      </td>
                      <td className="py-1.5 text-right text-slate-500">
                        {f.fare_fuel ? f.fare_fuel.toLocaleString('ko-KR') + '원' : '—'}
                      </td>
                      <td className="py-1.5 text-right text-slate-500">
                        {f.fare_tax ? f.fare_tax.toLocaleString('ko-KR') + '원' : '—'}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-brand">
                        {totalFare > 0
                          ? totalFare.toLocaleString('ko-KR') + '원'
                          : f.flight_fare
                            ? formatPrice(f.flight_fare, f.currency_code)
                            : '—'}
                      </td>
                    </tr>
                  )
                })}
                {/* 합계 행 */}
                {flights.length > 1 && (
                  <tr className="border-t border-slate-200 bg-slate-100/60">
                    <td className="py-1.5 text-[10px] text-slate-400 font-medium">합계</td>
                    <td className="py-1.5" />
                    <td className="py-1.5 text-right font-semibold text-slate-700">
                      {flights.reduce((s, f) => s + (f.seats_group ?? 0), 0)}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">
                      {flights.reduce((s, f) => s + (f.seats_indivi ?? 0), 0)}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">
                      {flights.reduce((s, f) => s + (f.seats_business ?? 0), 0)}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-brand">
                      {flights.reduce((s, f) => s + (f.seats_group ?? 0) + (f.seats_indivi ?? 0) + (f.seats_business ?? 0), 0) || '—'}
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
        {hotels.length === 0 ? (
          <p className="text-xs text-slate-400">등록된 호텔이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[380px] w-full text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-1.5 font-medium">호텔명</th>
                  <th className="text-left pb-1.5 w-24 font-medium">투숙일</th>
                  <th className="text-right pb-1.5 w-28 font-medium">요금</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hotels.map(h => (
                  <tr key={h.id} className="hover:bg-white/60 transition-colors">
                    <td className="py-1.5 font-medium text-slate-700">{h.hotel_name}</td>
                    <td className="py-1.5 text-slate-500">{formatDate(h.stay_date)}</td>
                    <td className="py-1.5 text-right text-slate-600">{formatPrice(h.room_rate, h.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 메인 InventoryTab ──────────────────────────────────────────────────────
export default function InventoryTab() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: voyages = [], isLoading } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })
  const { data: allGrades = [] } = useQuery({
    queryKey: ['all-cabin-grades'],
    queryFn: fetchAllCabinGrades,
  })
  const { data: allFlights = [] } = useQuery({
    queryKey: ['all-voyage-flights'],
    queryFn: fetchAllVoyageFlights,
  })
  const { data: allHotels = [] } = useQuery({
    queryKey: ['all-hotels'],
    queryFn: fetchAllHotels,
  })

  const gradeMap = useMemo(() => {
    const map: Record<string, CabinGrade[]> = {}
    allGrades.forEach(g => {
      if (!map[g.voyage_id]) map[g.voyage_id] = []
      map[g.voyage_id].push(g)
    })
    return map
  }, [allGrades])

  const flightMap = useMemo(() => {
    const map: Record<string, VoyageFlight[]> = {}
    allFlights.forEach(f => {
      if (!map[f.voyage_id]) map[f.voyage_id] = []
      map[f.voyage_id].push(f)
    })
    return map
  }, [allFlights])

  const hotelMap = useMemo(() => {
    const map: Record<string, Hotel[]> = {}
    allHotels.forEach(h => {
      if (!map[h.voyage_id]) map[h.voyage_id] = []
      map[h.voyage_id].push(h)
    })
    return map
  }, [allHotels])

  const years = useMemo(() => {
    const ys = new Set<string>()
    voyages.forEach(v => { if (v.departure_date) ys.add(v.departure_date.slice(0, 4)) })
    return Array.from(ys).sort().reverse()
  }, [voyages])

  const filtered = useMemo(() => {
    return voyages.filter(v => {
      if (yearFilter !== 'ALL' && !v.departure_date?.startsWith(yearFilter)) return false
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false
      if (!filter) return true
      const q = filter.toLowerCase()
      const hotels = hotelMap[v.id] ?? []
      return (
        voyageTitle(v).toLowerCase().includes(q) ||
        (v.ship_name ?? '').toLowerCase().includes(q) ||
        (v.cruise_line ?? '').toLowerCase().includes(q) ||
        (v.airline ?? '').toLowerCase().includes(q) ||
        hotels.some(h => h.hotel_name.toLowerCase().includes(q))
      )
    })
  }, [voyages, yearFilter, statusFilter, filter, hotelMap])

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">보유 현황</h1>
          <p className="text-sm text-slate-400">행사별 크루즈·항공·호텔 보유 현황 — ▶ 클릭으로 상세 확인</p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect value={yearFilter} years={years} onChange={setYearFilter} />
          <FieldSelect
            value={statusFilter}
            options={[
              { value: 'ALL', label: '전체 상태' },
              '미오픈', '판매중', '마감', '출발완료', '취소',
            ]}
            onChange={setStatusFilter}
            className="h-8 text-sm w-28"
          />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="행사·선박·항공·호텔 검색"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[860px] w-full text-xs table-fixed">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-2 py-2.5 w-8" />
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-32">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">출발일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-28">
                <div className="flex items-center gap-1">
                  <Ship className="h-3 w-3 text-blue-400" />크루즈
                </div>
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">
                <div className="flex items-center gap-1">
                  <Plane className="h-3 w-3 text-sky-400" />항공
                </div>
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-amber-400" />호텔
                </div>
              </th>
              <th className="px-2 py-2.5 text-right font-semibold text-slate-500 w-14 whitespace-nowrap">보유캐빈</th>
              <th className="px-2 py-2.5 text-right font-semibold text-slate-500 w-14 whitespace-nowrap">잔여캐빈</th>
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
            {filtered.map(v => {
              const grades  = gradeMap[v.id] ?? []
              const flights = flightMap[v.id] ?? []
              const hotels  = hotelMap[v.id] ?? []

              const totalCabin     = grades.length > 0 ? grades.reduce((s, g) => s + g.total, 0) : (v.cabin_total ?? 0)
              const reservedCabin  = grades.length > 0 ? grades.reduce((s, g) => s + g.reserved, 0) : ((v.cabin_total ?? 0) - (v.cabin_remaining ?? 0))
              const remainingCabin = grades.length > 0 ? grades.reduce((s, g) => s + (g.total - g.reserved), 0) : (v.cabin_remaining ?? 0)
              const totalSeats     = flights.reduce((s, f) => s + (f.seats_group ?? 0) + (f.seats_indivi ?? 0) + (f.seats_business ?? 0), 0)

              const firstHotelName = hotels[0]?.hotel_name ?? null
              const hotelDisplay   = hotels.length > 1
                ? `${firstHotelName} 외 ${hotels.length - 1}곳`
                : firstHotelName

              const airlineLabel = [v.airline, v.airline_return].filter(Boolean).join(' / ') || null

              const isCancelled = v.status === '취소'
              const isExpanded  = expandedId === v.id

              return (
                <Fragment key={v.id}>
                  <tr
                    className={[
                      'border-b border-slate-100 hover:bg-slate-50 transition-colors',
                      isCancelled ? 'opacity-50' : '',
                      isExpanded  ? 'bg-slate-50' : '',
                    ].join(' ')}
                  >
                    {/* 펼치기 */}
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => toggleExpand(v.id)}
                        className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-100 transition"
                        title="보유 현황 상세"
                      >
                        {isExpanded
                          ? <ChevronDown className="h-3.5 w-3.5" />
                          : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </td>

                    {/* 행사명 */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isCancelled ? (
                        <span className="line-through text-slate-400">{voyageTitle(v)}</span>
                      ) : (
                        <button
                          onClick={() => navigate(`/voyages?tab=항차검색&voyage=${v.id}`)}
                          className="group flex items-center gap-1 font-medium text-slate-800 hover:text-brand transition"
                          title="항차 상세에서 보기"
                        >
                          {voyageTitle(v)}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        </button>
                      )}
                    </td>

                    {/* 출발일 */}
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(v.departure_date)}</td>

                    {/* 크루즈 */}
                    <td className="px-3 py-2 text-slate-600 truncate">
                      {v.ship_name ?? v.cruise_line ?? '—'}
                    </td>

                    {/* 항공 */}
                    <td className="px-3 py-2 text-slate-600 truncate">{airlineLabel ?? '—'}</td>

                    {/* 호텔 */}
                    <td className="px-3 py-2 text-slate-600 truncate">{hotelDisplay ?? '—'}</td>

                    {/* 보유캐빈 */}
                    <td className="px-2 py-2 text-right text-slate-700">{totalCabin || '—'}</td>

                    {/* 잔여캐빈 */}
                    <td className="px-2 py-2 text-right">
                      <span className={remainingCabin === 0 && totalCabin > 0 ? 'text-red-500 font-semibold' : 'text-slate-700'}>
                        {totalCabin > 0 ? remainingCabin : '—'}
                      </span>
                    </td>

                    {/* 보유좌석 */}
                    <td className="px-2 py-2 text-right text-slate-700">{totalSeats || '—'}</td>
                  </tr>

                  {/* 보유 현황 서브 패널 */}
                  {isExpanded && (
                    <tr className="border-b border-slate-200">
                      <td colSpan={9} className="p-0">
                        <InventoryPanel grades={grades} flights={flights} hotels={hotels} />
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
