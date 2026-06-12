import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTrips, getDashboardStats } from '../lib/trips'
import { getTotalPassengersThisMonth } from '../lib/passengers'
import StatusBadge from '../components/StatusBadge'

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue:  'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange:'bg-orange-50 text-orange-600',
  }
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${colors[color]}`}>
        {icon}
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

export default function Dashboard() {
  const [stats, setStats] = useState({ upcoming: 0, ongoing: 0, total: 0 })
  const [paxCount, setPaxCount] = useState(0)
  const [upcomingTrips, setUpcomingTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, pax, trips] = await Promise.all([
          getDashboardStats(),
          getTotalPassengersThisMonth(),
          getTrips({ status: 'upcoming', limit: 5 }),
        ])
        setStats(s)
        setPaxCount(pax)
        setUpcomingTrips(trips)
      } catch {
        // Supabase 미연결 시 빈 상태 유지
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">대시보드</h1>
        <p className="text-sm text-slate-500 mt-0.5">이라이프투어 여행 현황 한눈에 보기</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="예정 여행" value={loading ? '…' : stats.upcoming} icon="📅" color="blue" />
        <StatCard label="진행중 여행" value={loading ? '…' : stats.ongoing} icon="✈️" color="green" />
        <StatCard label="전체 여행" value={loading ? '…' : stats.total} icon="🗺️" color="orange" />
        <StatCard label="이번달 신규 여행자" value={loading ? '…' : paxCount} icon="👥" color="blue" />
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
            <span className="text-3xl">📭</span>
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
