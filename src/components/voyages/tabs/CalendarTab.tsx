import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths,
  parseISO, isWithinInterval, isSameDay,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchVoyages } from '@/lib/queries/voyages'
import type { Voyage, VoyageStatus } from '@/types/database'

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

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MAX_SHOW = 3

export default function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const navigate = useNavigate()

  const { data: voyages = [], isLoading } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days       = eachDayOfInterval({ start: calStart, end: calEnd })

  const getVoyagesForDay = (day: Date): Voyage[] =>
    voyages.filter(v => {
      const start = parseISO(v.departure_date)
      const end   = v.return_date ? parseISO(v.return_date) : start
      return isWithinInterval(day, { start, end })
    })

  const voyagesThisMonth = voyages.filter(v =>
    isSameMonth(parseISO(v.departure_date), currentDate)
  )

  const goToVoyage = (id: string) =>
    navigate(`/voyages?tab=항차검색&voyage=${id}`)

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-sm text-slate-500">
          {format(currentDate, 'yyyy년 M월', { locale: ko })} · 출발 행사{' '}
          <span className="font-semibold text-slate-700">{voyagesThisMonth.length}건</span>
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
              const dayVoyages = getVoyagesForDay(day)
              const inMonth   = isSameMonth(day, currentDate)
              const todayFlag = isToday(day)
              const isSun = day.getDay() === 0
              const isSat = day.getDay() === 6

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[90px] md:min-h-[110px] p-1.5 border-b border-slate-100 ${
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

                  {/* 행사 이벤트 */}
                  <div className="space-y-0.5">
                    {dayVoyages.slice(0, MAX_SHOW).map(v => (
                      <button
                        key={v.id}
                        onClick={() => goToVoyage(v.id)}
                        title={`${v.region} (${v.departure_date} ~ ${v.return_date ?? ''})`}
                        className={`w-full flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border truncate transition hover:opacity-75 ${
                          STATUS_STYLE[v.status]
                        }`}
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
                    {dayVoyages.length > MAX_SHOW && (
                      <p className="text-[10px] text-slate-400 px-1">
                        +{dayVoyages.length - MAX_SHOW}개 더
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 범례 + 이번 달 행사 목록 */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">범례</p>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(STATUS_STYLE) as VoyageStatus[]).map(key => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`inline-block w-3 h-3 rounded-sm border ${STATUS_STYLE[key]}`} />
                <span className="text-xs text-slate-600">{key}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            <span className="font-semibold">출</span> = 출발일 &nbsp;·&nbsp;
            <span className="font-semibold">귀</span> = 귀국일
          </p>
        </div>

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
      </div>
    </div>
  )
}
