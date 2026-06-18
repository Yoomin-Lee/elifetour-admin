import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ship, Anchor, Users, CreditCard } from 'lucide-react'
import { fetchVoyageDashboardData } from '../lib/queries/voyages'

const CATEGORY_LABEL   = { CRUISE: '크루즈', FLIGHT: '항공', HOTEL: '호텔' }
const PAYMENT_TYPE_LABEL = { DEPOSIT_1ST: '1차계약금', DEPOSIT_2ND: '2차계약금', BALANCE: '잔금' }

function StatCard({ label, value, icon: Icon, color, sub }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan:   'bg-cyan-50 text-cyan-600',
    red:    'bg-red-50 text-red-600',
  }
  return (
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
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
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

function cabinBadge(remaining, total) {
  if (total === 0) return { text: '-', cls: 'text-slate-400' }
  if (remaining === 0) return { text: '마감', cls: 'text-red-500 font-semibold' }
  const ratio = remaining / total
  const cls = ratio > 0.2 ? 'text-emerald-600' : 'text-amber-600 font-medium'
  return { text: `${remaining} / ${total}석`, cls }
}

function isOverdue(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dateStr) < today
}

export default function Dashboard() {
  const [dash, setDash] = useState({ onSaleVoyages: [], thisMonthDepartures: [], thisMonthPayments: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVoyageDashboardData()
      .then(setDash)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const { onSaleVoyages, thisMonthDepartures, thisMonthPayments } = dash
  const totalCustomers   = onSaleVoyages.reduce((s, v) => s + (v.customer_count || 0), 0)
  const overdueCount     = thisMonthPayments.filter(p => isOverdue(p.due_date)).length

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
        />
      </div>

      {/* 판매중 항차 현황 */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">판매중 항차 현황</h2>
          <Link to="/voyages" className="text-sm font-medium text-brand hover:underline">
            항차 관리 →
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm">불러오는 중...</div>
        ) : onSaleVoyages.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm">판매중인 항차가 없습니다</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">지역</th>
                  <th className="px-5 py-3 text-left">선박</th>
                  <th className="px-5 py-3 text-left">출발일</th>
                  <th className="px-5 py-3 text-right">예약인원</th>
                  <th className="px-5 py-3 text-right">잔여 캐빈</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {onSaleVoyages.map((v) => {
                  const cb = cabinBadge(v.cabin_remaining, v.cabin_total)
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{v.region}</td>
                      <td className="px-5 py-3.5 text-slate-500">{v.ship_name ?? '-'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{formatDate(v.departure_date)}</td>
                      <td className="px-5 py-3.5 text-right text-slate-700">
                        {(v.customer_count || 0).toLocaleString('ko-KR')}명
                      </td>
                      <td className={`px-5 py-3.5 text-right ${cb.cls}`}>{cb.text}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 이번달 그리드 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* 이번달 결제 마감 */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-800">이번달 결제 마감</h2>
              {overdueCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  연체 {overdueCount}건
                </span>
              )}
            </div>
            <Link to="/voyages?tab=결제" className="text-sm font-medium text-brand hover:underline">
              결제 탭 →
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">불러오는 중...</div>
          ) : thisMonthPayments.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">이번달 결제 마감이 없습니다</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {thisMonthPayments.map((p) => {
                const overdue = isOverdue(p.due_date)
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-3 px-5 py-3.5 ${overdue ? 'bg-red-50/50' : ''}`}
                  >
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
                      <p className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-slate-800'}`}>
                        {formatDate(p.due_date)}{overdue ? ' ⚠' : ''}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatAmount(p.amount, p.currency)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 이번달 출발 항차 */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">이번달 출발 항차</h2>
            <Link to="/voyages?tab=달력" className="text-sm font-medium text-brand hover:underline">
              전체 보기 →
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">불러오는 중...</div>
          ) : thisMonthDepartures.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">이번달 출발 항차가 없습니다</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {thisMonthDepartures.map((v) => {
                const cb = cabinBadge(v.cabin_remaining, v.cabin_total)
                return (
                  <div key={v.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{v.region}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{v.ship_name ?? '-'}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm text-slate-600">{formatDate(v.departure_date)}</p>
                      <p className={`text-xs mt-0.5 ${cb.cls}`}>{cb.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
