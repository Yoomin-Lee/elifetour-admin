import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths,
  parseISO, isWithinInterval, isSameDay,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchVoyages } from '@/lib/queries/voyages'
import { fetchPaymentSchedulesByMonth } from '@/lib/queries/paymentSchedules'
import type { Voyage, VoyageStatus, PaymentCategory, PaymentType } from '@/types/database'
import type { PaymentScheduleRow } from '@/lib/queries/paymentSchedules'

const STATUS_STYLE: Record<VoyageStatus, string> = {
  '미오픈':   'bg-slate-100 text-slate-500 border-slate-200',
  '판매중':   'bg-blue-50 text-blue-700 border-blue-200',
  '마감':     'bg-orange-50 text-orange-600 border-orange-200',
  '출발완료': 'bg-green-50 text-green-700 border-green-200',
  '취소':     'bg-red-50 text-red-400 border-red-200 line-through',
}

const STATUS_DOT: Record<VoyageStatus, string> = {
  '미오픈':   'bg-slate-400',
  '판매중':   'bg-blue-400',
  '마감':     'bg-orange-400',
  '출발완료': 'bg-green-400',
  '취소':     'bg-red-300',
}

const PAYMENT_STYLE: Record<PaymentCategory, string> = {
  CRUISE: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  FLIGHT: 'bg-amber-50 text-amber-700 border-amber-200',
  HOTEL:  'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const PAYMENT_CATEGORY_LABEL: Record<PaymentCategory, string> = {
  CRUISE: '크루즈', FLIGHT: '항공', HOTEL: '호텔',
}

const PAYMENT_TYPE_SHORT: Record<PaymentType, string> = {
  DEPOSIT_1ST: '1차', DEPOSIT_2ND: '2차', BALANCE: '잔금',
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MAX_VOYAGE_SHOW = 2
const MAX_PAYMENT_SHOW = 2

export default function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const navigate = useNavigate()

  const { data: voyages = [], isLoading: voyagesLoading } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const currentYear  = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1  // 1-12

  // 현재 연월 데이터만 동적 페칭 — 대용량 누적에도 일정한 쿼리 크기 유지
  const { data: payments = [], isFetching: paymentsFetching } = useQuery({
    queryKey: ['payment-schedules-month', currentYear, currentMonth],
    queryFn: () => fetchPaymentSchedulesByMonth(currentYear, currentMonth),
    staleTime: 60_000,
  })

  // 달력 날짜 범위 계산: currentDate 변경 시에만 재계산
  const days = useMemo(() => {
    const ms = startOfMonth(currentDate)
    const me = endOfMonth(currentDate)
    return eachDayOfInterval({
      start: startOfWeek(ms, { weekStartsOn: 0 }),
      end:   endOfWeek(me,   { weekStartsOn: 0 }),
    })
  }, [currentDate])

  // 날짜별 행사 맵: voyages/currentDate 변경 시에만 재계산
  const voyagesByDay = useMemo(() => {
    const map = new Map<string, Voyage[]>()
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd')
      map.set(key, voyages.filter(v => {
        const start = parseISO(v.departure_date)
        const end   = v.return_date ? parseISO(v.return_date) : start
        return isWithinInterval(day, { start, end })
      }))
    }
    return map
  }, [voyages, days])

  // 날짜별 결제 마감 맵: payments/days 변경 시에만 재계산
  const paymentsByDay = useMemo(() => {
    const map = new Map<string, PaymentScheduleRow[]>()
    for (const p of payments) {
      const key = p.due_date  // already YYYY-MM-DD
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    }
    return map
  }, [payments])

  const getVoyagesForDay  = (day: Date): Voyage[]            => voyagesByDay.get(format(day, 'yyyy-MM-dd'))  ?? []
  const getPaymentsForDay = (day: Date): PaymentScheduleRow[] => paymentsByDay.get(format(day, 'yyyy-MM-dd')) ?? []

  const voyagesThisMonth = useMemo(
    () => voyages.filter(v => isSameMonth(parseISO(v.departure_date), currentDate)),
    [voyages, currentDate],
  )

  // 이번 달 결제 마감: 날짜순 (이미 due_date 기준 정렬로 수신)
  const paymentsThisMonth = useMemo(
    () => [...payments].sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [payments],
  )

  const goToVoyage = (id: string) =>
    navigate(`/voyages?tab=항차검색&voyage=${id}`)

  const isLoading = voyagesLoading || paymentsFetching

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-sm text-slate-500">
          {format(currentDate, 'yyyy년 M월', { locale: ko })} · 출발 행사{' '}
          <span className="font-semibold text-slate-700">{voyagesThisMonth.length}건</span>
          {paymentsThisMonth.length > 0 && (
            <>
              {' · '}결제 마감{' '}
              <span className="font-semibold text-slate-700">{paymentsThisMonth.length}건</span>
            </>
          )}
        </p>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent mr-2" />
            불러오는 중...
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {days.map(day => {
              const dayVoyages  = getVoyagesForDay(day)
              const dayPayments = getPaymentsForDay(day)
              const inMonth     = isSameMonth(day, currentDate)
              const todayFlag   = isToday(day)
              const isSun = day.getDay() === 0
              const isSat = day.getDay() === 6

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] md:min-h-[120px] p-1.5 border-b border-slate-100 ${
                    !inMonth ? 'bg-slate-50/60' : ''
                  }`}
                >
                  {/* 날짜 숫자 */}
                  <div className="flex justify-end mb-1">
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
                  </div>

                  <div className="space-y-0.5">
                    {/* 행사 이벤트 */}
                    {dayVoyages.slice(0, MAX_VOYAGE_SHOW).map(v => (
                      <button
                        key={v.id}
                        onClick={() => goToVoyage(v.id)}
                        title={`${v.region} (${v.departure_date} ~ ${v.return_date ?? ''})`}
                        className={`w-full flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border truncate transition hover:opacity-75 ${STATUS_STYLE[v.status]}`}
                      >
                        {isSameDay(day, parseISO(v.departure_date)) && (
                          <span className="shrink-0 text-[9px] font-bold opacity-70">출</span>
                        )}
                        {v.return_date && isSameDay(day, parseISO(v.return_date)) && (
                          <span className="shrink-0 text-[9px] font-bold opacity-70">귀</span>
                        )}
                        <span className="truncate">{v.region}</span>
                      </button>
                    ))}
                    {dayVoyages.length > MAX_VOYAGE_SHOW && (
                      <p className="text-[10px] text-slate-400 px-1">
                        +{dayVoyages.length - MAX_VOYAGE_SHOW}개
                      </p>
                    )}

                    {/* 결제 마감일 */}
                    {dayPayments.length > 0 && (
                      <div className="mt-0.5 pt-0.5 border-t border-slate-100 space-y-0.5">
                        {dayPayments.slice(0, MAX_PAYMENT_SHOW).map(p => (
                          <div
                            key={p.id}
                            title={`${PAYMENT_CATEGORY_LABEL[p.category]} ${PAYMENT_TYPE_SHORT[p.payment_type]} 마감${p.voyages ? ` · ${p.voyages.region}` : ''}`}
                            className={`w-full flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border border-dashed truncate ${
                              p.is_completed
                                ? 'opacity-40 line-through bg-slate-50 border-slate-200 text-slate-400'
                                : PAYMENT_STYLE[p.category]
                            }`}
                          >
                            <span className="shrink-0 font-bold text-[9px]">
                              {PAYMENT_CATEGORY_LABEL[p.category][0]}
                            </span>
                            <span className="truncate">
                              {PAYMENT_TYPE_SHORT[p.payment_type]}
                              {p.voyages && ` ${p.voyages.region}`}
                            </span>
                          </div>
                        ))}
                        {dayPayments.length > MAX_PAYMENT_SHOW && (
                          <p className="text-[10px] text-slate-400 px-1">
                            +{dayPayments.length - MAX_PAYMENT_SHOW}건
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 하단 패널 */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 범례 */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">범례</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.keys(STATUS_STYLE) as VoyageStatus[]).map(key => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`inline-block w-3 h-3 rounded-sm border ${STATUS_STYLE[key]}`} />
                <span className="text-xs text-slate-600">{key}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            <span className="font-semibold">출</span> = 출발일 &nbsp;·&nbsp;
            <span className="font-semibold">귀</span> = 귀국일
          </p>
          <div className="border-t border-slate-100 pt-2 flex flex-wrap gap-2">
            {(['CRUISE','FLIGHT','HOTEL'] as PaymentCategory[]).map(c => (
              <div key={c} className="flex items-center gap-1.5">
                <span className={`inline-block w-3 h-3 rounded-sm border border-dashed ${PAYMENT_STYLE[c]}`} />
                <span className="text-xs text-slate-600">{PAYMENT_CATEGORY_LABEL[c]} 결제</span>
              </div>
            ))}
          </div>
        </div>

        {/* 이번 달 출발 행사 */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            {format(currentDate, 'M월', { locale: ko })} 출발 행사
          </p>
          {voyagesThisMonth.length === 0 ? (
            <p className="text-sm text-slate-400">이번 달 출발 행사가 없습니다.</p>
          ) : (
            <div className="space-y-1">
              {[...voyagesThisMonth]
                .sort((a, b) => a.departure_date.localeCompare(b.departure_date))
                .map(v => (
                  <button
                    key={v.id}
                    onClick={() => goToVoyage(v.id)}
                    className="w-full flex items-center gap-2.5 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition text-left"
                  >
                    <span className={`shrink-0 w-2 h-2 rounded-full ${STATUS_DOT[v.status]}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{v.region}</p>
                      <p className="text-xs text-slate-400">
                        {v.departure_date} ~ {v.return_date ?? '-'}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* 이번 달 결제 마감 */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            {format(currentDate, 'M월', { locale: ko })} 결제 마감
          </p>
          {paymentsThisMonth.length === 0 ? (
            <p className="text-sm text-slate-400">이번 달 결제 마감이 없습니다.</p>
          ) : (
            <div className="space-y-1">
              {paymentsThisMonth.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                    p.is_completed ? 'opacity-50' : ''
                  }`}
                >
                  <span className={`shrink-0 w-2 h-2 rounded-full border-2 ${
                    p.category === 'CRUISE' ? 'border-cyan-400' :
                    p.category === 'FLIGHT' ? 'border-amber-400' : 'border-emerald-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium text-slate-700 truncate ${p.is_completed ? 'line-through' : ''}`}>
                      {PAYMENT_CATEGORY_LABEL[p.category]} {PAYMENT_TYPE_SHORT[p.payment_type]}
                      {p.voyages && <span className="text-slate-400 font-normal"> · {p.voyages.region}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400">{p.due_date}</p>
                  </div>
                  {p.is_completed && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

