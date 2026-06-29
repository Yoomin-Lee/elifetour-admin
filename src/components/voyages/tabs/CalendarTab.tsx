import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchPaymentSchedulesByMonth } from '@/lib/queries/paymentSchedules'
import type { PaymentCategory } from '@/types/database'
import type { PaymentScheduleRow } from '@/lib/queries/paymentSchedules'

const PAYMENT_STYLE: Record<PaymentCategory, string> = {
  CRUISE:    'bg-cyan-50 text-cyan-700 border-cyan-300',
  FLIGHT:    'bg-amber-50 text-amber-700 border-amber-300',
  HOTEL:     'bg-emerald-50 text-emerald-700 border-emerald-300',
  LAND:      'bg-violet-50 text-violet-700 border-violet-300',
  INSURANCE: 'bg-rose-50 text-rose-700 border-rose-300',
}

const PAYMENT_DOT: Record<PaymentCategory, string> = {
  CRUISE:    'bg-cyan-400',
  FLIGHT:    'bg-amber-400',
  HOTEL:     'bg-emerald-400',
  LAND:      'bg-violet-400',
  INSURANCE: 'bg-rose-400',
}

const PAYMENT_CATEGORY_LABEL: Record<PaymentCategory, string> = {
  CRUISE: '크루즈', FLIGHT: '항공', HOTEL: '호텔', LAND: '랜드', INSURANCE: '보험',
}

function ptLabel(pt: string): string {
  if (pt === 'DEPOSIT_1ST') return '1차'
  if (pt === 'DEPOSIT_2ND') return '2차'
  if (pt === 'BALANCE') return '잔금'
  const m = pt.match(/^DEPOSIT_(\d+)$/)
  if (m) return `${m[1]}차`
  return pt
}

function fmtDep(d: string): string {
  // "2027-10-16" → "27/10/16"
  return d.slice(2, 4) + '/' + d.slice(5, 7) + '/' + d.slice(8, 10)
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MAX_PAYMENT_SHOW = 4

export default function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const navigate = useNavigate()

  const currentYear  = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const { data: payments = [], isFetching } = useQuery({
    queryKey: ['payment-schedules-month', currentYear, currentMonth],
    queryFn: () => fetchPaymentSchedulesByMonth(currentYear, currentMonth),
    staleTime: 60_000,
  })

  const days = useMemo(() => {
    const ms = startOfMonth(currentDate)
    const me = endOfMonth(currentDate)
    return eachDayOfInterval({
      start: startOfWeek(ms, { weekStartsOn: 0 }),
      end:   endOfWeek(me,   { weekStartsOn: 0 }),
    })
  }, [currentDate])

  const paymentsByDay = useMemo(() => {
    const map = new Map<string, PaymentScheduleRow[]>()
    for (const p of payments) {
      if (!p.due_date) continue
      const list = map.get(p.due_date) ?? []
      list.push(p)
      map.set(p.due_date, list)
    }
    return map
  }, [payments])

  const getPaymentsForDay = (day: Date): PaymentScheduleRow[] =>
    paymentsByDay.get(format(day, 'yyyy-MM-dd')) ?? []

  const paymentsThisMonth = useMemo(
    () => [...payments].filter(p => p.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!)),
    [payments],
  )

  const pendingCount = paymentsThisMonth.filter(p => !p.is_completed).length

  const goToPayment = (id: string) => navigate(`/voyages?tab=결제&voyage=${id}`)

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-sm text-slate-500">
            {format(currentDate, 'yyyy년 M월', { locale: ko })} · 결제 마감{' '}
            <span className="font-semibold text-slate-700">{paymentsThisMonth.length}건</span>
            {pendingCount > 0 && (
              <span className="ml-2 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                미완료 {pendingCount}건
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            오늘
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              aria-label="이전 달"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-slate-800 w-28 text-center select-none">
              {format(currentDate, 'yyyy년 M월', { locale: ko })}
            </span>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              aria-label="다음 달"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      <div className="card overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {WEEK_DAYS.map((d, i) => (
            <div
              key={d}
              className={`py-3 text-center text-xs font-semibold tracking-wide ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        {isFetching ? (
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent mr-2" />
            불러오는 중...
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {days.map(day => {
              const dayPayments = getPaymentsForDay(day)
              const inMonth    = isSameMonth(day, currentDate)
              const todayFlag  = isToday(day)
              const isSun = day.getDay() === 0
              const isSat = day.getDay() === 6
              const hasPending = dayPayments.some(p => !p.is_completed)

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[110px] md:min-h-[130px] p-1.5 border-b border-slate-100 ${
                    !inMonth ? 'bg-slate-50/60' : ''
                  }`}
                >
                  {/* 날짜 숫자 */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        todayFlag  ? 'bg-brand text-white font-bold' :
                        !inMonth   ? 'text-slate-300' :
                        isSun      ? 'text-red-500' :
                        isSat      ? 'text-blue-500' :
                                     'text-slate-600'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {hasPending && inMonth && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    )}
                  </div>

                  {/* 결제 마감 */}
                  <div className="space-y-0.5">
                    {dayPayments.slice(0, MAX_PAYMENT_SHOW).map(p => (
                      <button
                        key={p.id}
                        onClick={() => goToPayment(p.voyage_id)}
                        title={`${PAYMENT_CATEGORY_LABEL[p.category]} ${ptLabel(p.payment_type)}${p.voyages ? ` · ${fmtDep(p.voyages.departure_date)} ${p.voyages.region}` : ''}`}
                        className={`w-full flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border truncate transition hover:opacity-80 ${
                          p.is_completed
                            ? 'opacity-35 line-through bg-slate-50 border-slate-200 text-slate-400'
                            : PAYMENT_STYLE[p.category]
                        }`}
                      >
                        <span className="shrink-0 font-bold">
                          {PAYMENT_CATEGORY_LABEL[p.category][0]}
                        </span>
                        <span className="truncate flex-1">
                          {ptLabel(p.payment_type)}
                          {p.voyages && ` ${fmtDep(p.voyages.departure_date)} ${p.voyages.region}`}
                        </span>
                        {p.is_completed && <Check className="h-2.5 w-2.5 shrink-0" />}
                      </button>
                    ))}
                    {dayPayments.length > MAX_PAYMENT_SHOW && (
                      <p className="text-[10px] text-slate-400 px-1">
                        +{dayPayments.length - MAX_PAYMENT_SHOW}건
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 하단 패널 */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 범례 */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">범례</p>
          <div className="space-y-2">
            {(Object.keys(PAYMENT_STYLE) as PaymentCategory[]).map(c => (
              <div key={c} className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-sm border ${PAYMENT_STYLE[c]}`} />
                <span className="text-xs text-slate-600">{PAYMENT_CATEGORY_LABEL[c]}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="text-xs text-slate-500">미완료 마감 있음</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              <span className="text-xs text-slate-500">완료</span>
            </div>
          </div>
        </div>

        {/* 이번 달 결제 마감 목록 */}
        <div className="card p-4 lg:col-span-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            {format(currentDate, 'M월', { locale: ko })} 결제 마감
          </p>
          {paymentsThisMonth.length === 0 ? (
            <p className="text-sm text-slate-400">이번 달 결제 마감이 없습니다.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {paymentsThisMonth.map(p => (
                <button
                  key={p.id}
                  onClick={() => goToPayment(p.voyage_id)}
                  className={`w-full flex items-center gap-3 px-2 py-2.5 text-left transition hover:bg-slate-50 rounded-lg ${
                    p.is_completed ? 'opacity-50' : ''
                  }`}
                >
                  <span className={`shrink-0 w-2 h-2 rounded-full ${PAYMENT_DOT[p.category]}`} />
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${PAYMENT_STYLE[p.category]}`}>
                    {PAYMENT_CATEGORY_LABEL[p.category]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium text-slate-700 truncate ${p.is_completed ? 'line-through' : ''}`}>
                      {ptLabel(p.payment_type)}
                      {p.voyages && (
                        <span className="ml-1.5 text-slate-400 font-normal text-xs">
                          {fmtDep(p.voyages.departure_date)} {p.voyages.region}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs tabular-nums ${
                    p.is_completed ? 'text-slate-400' : 'text-slate-500 font-medium'
                  }`}>
                    {p.due_date}
                  </span>
                  {p.is_completed && <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
