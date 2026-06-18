import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Plane, Map, Users, Inbox, Ship, Anchor } from 'lucide-react'
import { getTrips, getDashboardStats } from '../lib/trips'
import { getTotalPassengersThisMonth } from '../lib/passengers'
import { fetchVoyageDashboardData } from '../lib/queries/voyages'
import StatusBadge from '../components/StatusBadge'

const CATEGORY_LABEL = { CRUISE: '크루즈', FLIGHT: '항공', HOTEL: '호텔' }
const PAYMENT_TYPE_LABEL = { DEPOSIT_1ST: '1차계약금', DEPOSIT_2ND: '2차계약금', BALANCE: '잔금' }

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan:   'bg-cyan-50 text-cyan-600',
  }
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function nightsCount(depart, ret) {
  if (!depart || !ret) return '-'
  const diff = (new Date(ret) - new Date(depart)) / 86400000
  return `${diff}박 ${diff + 1}일`
}

function voyageLabel(region, departure_date) {
  if (!departure_date) return region ?? '-'
  const d = departure_date
  return `${d.slice(2, 4)}/${d.slice(5, 7)}/${d.slice(8, 10)} ${region}`
}

function formatAmount(amount, currency) {
  if (!amount) return '-'
  if (currency === 'KRW') return `${Number(amount).toLocaleString('ko-KR')} 원`
  return `${currency} ${Number(amount).toLocaleString('en-US')}`
}

export default function Dashboard() {
  const [stats, setStats] = useState({ upcoming: 0, ongoing: 0, total: 0 })
  const [paxCount, setPaxCount] = useState(0)
  const [upcomingTrips, setUpcomingTrips] = useState([])
  const [voyageDash, setVoyageDash] = useState({ onSaleCount: 0, thisMonthDepartures: [], thisMonthPayments: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [statsRes, paxRes, tripsRes, voyageRes] = await Promise.allSettled([
        getDashboardStats(),
        getTotalPassengersThisMonth(),
        getTrips({ status: 'upcoming', limit: 5 }),
        fetchVoyageDashboardData(),
      ])
      if (statsRes.status === 'fulfilled') setStats(statsRes.value)
      if (paxRes.status === 'fulfilled') setPaxCount(paxRes.value)
      if (tripsRes.status === 'fulfilled') setUpcomingTrips(tripsRes.value)
      if (voyageRes.status === 'fulfilled') setVoyageDash(voyageRes.value)
      setLoading(false)
    }
    load()
  }, [])

  const { onSaleCount, thisMonthDepartures, thisMonthPayments } = voyageDash

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">대시보드</h1>
        <p className="text-sm text-slate-500 mt-0.5">이라이프투어 여행 현황 한눈에 보기</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="예정 여행"        value={loading ? '…' : stats.upcoming}              icon={CalendarDays} color="blue"   />
        <StatCard label="진행중 여행"       value={loading ? '…' : stats.ongoing}               icon={Plane}        color="green"  />
        <StatCard label="전체 여행"         value={loading ? '…' : stats.total}                 icon={Map}          color="orange" />
        <StatCard label="이번달 신규 여행자" value={loading ? '…' : paxCount}                   icon={Users}        color="blue"   />
        <StatCard label="판매중 항차"       value={loading ? '…' : onSaleCount}                 icon={Ship}         color="purple" />
        <StatCard label="이번달 출발 항차"  value={loading ? '…' : thisMonthDepartures.length}  icon={Anchor}       color="cyan"   />
      </div>

      {/* 항차 현황 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* 이번달 출발 항차 */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">이번달 출발 항차</h2>
            <Link to="/voyages" className="text-sm font-medium text-brand hover:underline">전체 보기 →</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">불러오는 중...</div>
          ) : thisMonthDepartures.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">이번달 출발 항차가 없습니다</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {thisMonthDepartures.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{v.region}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{v.ship_name ?? '-'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-slate-600">{formatDate(v.departure_date)}</p>
                    <p className={`text-xs mt-0.5 ${v.cabin_remaining > 0 ? 'text-slate-400' : 'text-red-500 font-medium'}`}>
                      {v.cabin_remaining > 0 ? `잔여 ${v.cabin_remaining}석` : '마감'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 이번달 결제 마감 */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">이번달 결제 마감</h2>
            <Link to="/voyages" className="text-sm font-medium text-brand hover:underline">항차 관리 →</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">불러오는 중...</div>
          ) : thisMonthPayments.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">이번달 결제 마감이 없습니다</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {thisMonthPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="rounded px-1.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600">
                        {CATEGORY_LABEL[p.category] ?? p.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        {PAYMENT_TYPE_LABEL[p.payment_type] ?? p.payment_type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 truncate">
                      {p.voyages ? voyageLabel(p.voyages.region, p.voyages.departure_date) : '-'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium text-slate-800">{formatDate(p.due_date)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatAmount(p.amount, p.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 예정 여행 목록 */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">예정 여행 (최근 5건)</h2>
          <Link to="/trips" className="text-sm font-medium text-brand hover:underline">
            전체 보기 →
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">불러오는 중...</div>
        ) : upcomingTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">예정된 여행이 없습니다</p>
            <Link to="/trips" className="btn-primary text-xs mt-1">여행 등록하기</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {upcomingTrips.map((trip) => (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{trip.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {trip.destination} · {formatDate(trip.depart_date)} ~ {formatDate(trip.return_date)} ({nightsCount(trip.depart_date, trip.return_date)})
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {trip.manager && (
                    <span className="hidden text-xs text-slate-400 sm:block">담당: {trip.manager}</span>
                  )}
                  <StatusBadge type="trip" value={trip.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
