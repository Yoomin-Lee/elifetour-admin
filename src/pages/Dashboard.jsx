import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ship, Anchor, Users, CreditCard, ChevronDown } from 'lucide-react'
import { fetchVoyageDashboardData } from '../lib/queries/voyages'

const STATUS_ITEMS = [
  { key: '미오픈',   label: '미오픈',   dot: 'bg-slate-400' },
  { key: '판매중',   label: '판매중',   dot: 'bg-blue-500'  },
  { key: '마감',     label: '마감',     dot: 'bg-orange-500'},
  { key: '출발완료', label: '출발완료', dot: 'bg-green-500' },
]

function StatCard({ label, value, icon: Icon, color, sub, link }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan:   'bg-cyan-50 text-cyan-600',
    red:    'bg-red-50 text-red-600',
  }
  const inner = (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-amber-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  return link ? <Link to={link} className="block hover:opacity-90 transition">{inner}</Link> : inner
}

function SectionHeader({ title, badge, link, linkLabel }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        {badge}
      </div>
      {link && (
        <Link to={link} className="text-sm font-medium text-brand hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

function Empty({ message }) {
  return (
    <div className="flex items-center justify-center py-10 text-slate-400 text-sm">{message}</div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-700">{value || '-'}</p>
    </div>
  )
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function formatAmount(amount, currency) {
  if (!amount) return '-'
  if (currency === 'KRW') return `${Number(amount).toLocaleString('ko-KR')} 원`
  return `${currency} ${Number(amount).toLocaleString('en-US')}`
}

function cabinBadge(remaining, total) {
  if (total === 0) return { text: '-', cls: 'text-slate-400' }
  if (remaining === 0) return { text: '마감', cls: 'text-red-500 font-semibold' }
  const cls = remaining / total > 0.2 ? 'text-emerald-600' : 'text-amber-600 font-medium'
  return { text: `${remaining} / ${total}석`, cls }
}

function isOverdue(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dateStr) < today
}

export default function Dashboard() {
  const [dash, setDash]         = useState({ onSaleVoyages: [], thisMonthDepartures: [], thisMonthPayments: [], statusCounts: {} })
  const [loading, setLoading]   = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchVoyageDashboardData()
      .then(setDash)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const { onSaleVoyages, thisMonthDepartures, thisMonthPayments } = dash
  const totalCustomers = onSaleVoyages.reduce((s, v) => s + (v.customer_count || 0), 0)
  const overdueCount   = thisMonthPayments.filter(p => isOverdue(p.due_date)).length

  const thisMonthStatusCounts = {}
  for (const v of thisMonthDepartures) {
    thisMonthStatusCounts[v.status] = (thisMonthStatusCounts[v.status] ?? 0) + 1
  }

  function toggle(id) {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">대시보드</h1>
        <p className="text-sm text-slate-500 mt-0.5">이라이프투어 항차 운영 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="판매중 항차"
          value={loading ? '…' : onSaleVoyages.length}
          icon={Ship}
          color="purple"
        />
        <StatCard
          label="총 예약 인원"
          value={loading ? '…' : `${totalCustomers.toLocaleString('ko-KR')}명`}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="이번달 출발"
          value={loading ? '…' : thisMonthDepartures.length}
          icon={Anchor}
          color="cyan"
        />
        <StatCard
          label="이번달 결제 마감"
          value={loading ? '…' : thisMonthPayments.length}
          icon={CreditCard}
          color={overdueCount > 0 ? 'red' : 'orange'}
          sub={overdueCount > 0 ? `연체 ${overdueCount}건` : null}
          link="/voyages?tab=결제"
        />
      </div>

      {/* 메인 그리드: 좌 3 / 우 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

        {/* ── 판매중 항차 현황 (아코디언) ── */}
        <div className="card overflow-hidden lg:col-span-3">
          <SectionHeader title="판매중 항차 현황" link="/voyages" linkLabel="항차 관리" />
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">불러오는 중...</div>
          ) : onSaleVoyages.length === 0 ? (
            <Empty message="판매중인 항차가 없습니다" />
          ) : (
            <div className="divide-y divide-slate-100">
              {onSaleVoyages.map((v) => {
                const cb     = cabinBadge(v.cabin_remaining, v.cabin_total)
                const isOpen = expandedId === v.id
                return (
                  <div key={v.id}>
                    {/* 요약 행: 클릭 → 항차 마스터 바로가기 / 화살표 → 아코디언 */}
                    <div className="flex items-center hover:bg-slate-50/60 transition">
                      <Link
                        to={`/voyages?tab=항차검색&voyage=${v.id}`}
                        className="flex flex-1 items-center gap-3 px-5 py-3.5 min-w-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{v.region}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{v.ship_name ?? '-'}</p>
                        </div>
                        <span className="shrink-0 text-sm text-slate-600 w-14 text-right">
                          {formatDate(v.departure_date)}
                        </span>
                        <span className="shrink-0 text-sm text-slate-600 w-10 text-right">
                          {v.customer_count || 0}명
                        </span>
                        <span className={`shrink-0 text-sm w-20 text-right ${cb.cls}`}>
                          {cb.text}
                        </span>
                      </Link>
                      <button
                        onClick={() => toggle(v.id)}
                        className="shrink-0 px-4 py-3.5 text-slate-400 hover:text-slate-600 transition"
                        aria-label="상세 펼치기"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* 펼침 상세 */}
                    {isOpen && (
                      <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                        <DetailItem label="귀항일"   value={formatDate(v.return_date)} />
                        <DetailItem label="크루즈사" value={v.cruise_line} />
                        <DetailItem label="항공사"   value={v.airline} />
                        <DetailItem label="인솔자"   value={v.tour_leader} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── 우측 컬럼 ── */}
        <div className="flex flex-col gap-4 lg:col-span-2">

          {/* 이번달 항차 현황 요약 */}
          <div className="card overflow-hidden">
            <SectionHeader title="이번달 항차 현황" link="/voyages" linkLabel="항차 관리" />
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm">불러오는 중...</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {STATUS_ITEMS.map(({ key, label, dot }) => (
                  <div key={key} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dot}`} />
                      <span className="text-sm text-slate-700">{label}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {thisMonthStatusCounts[key] ?? 0}건
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 이번달 출발 항차 */}
          <div className="card overflow-hidden">
            <SectionHeader title="이번달 출발 항차" link="/voyages?tab=달력" linkLabel="달력 보기" />
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm">불러오는 중...</div>
            ) : thisMonthDepartures.length === 0 ? (
              <Empty message="이번달 출발 항차가 없습니다" />
            ) : (
              <div className="divide-y divide-slate-50">
                {thisMonthDepartures.map((v) => {
                  const cb = cabinBadge(v.cabin_remaining, v.cabin_total)
                  return (
                    <Link
                      key={v.id}
                      to={`/voyages?tab=항차검색&voyage=${v.id}`}
                      className="flex items-center justify-between gap-2 px-5 py-3 hover:bg-slate-50/60 transition"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{v.region}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{v.ship_name ?? '-'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm text-slate-600">{formatDate(v.departure_date)}</p>
                        <p className={`text-xs mt-0.5 ${cb.cls}`}>{cb.text}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
