import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths,
  parseISO, isWithinInterval, isSameDay,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { getTrips } from '../lib/trips'

const STATUS_STYLE = {
  upcoming:  'bg-blue-50 text-blue-700 border-blue-200',
  ongoing:   'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-slate-100 text-slate-500 border-slate-200',
  cancelled: 'bg-red-50 text-red-400 border-red-200 line-through',
}

const STATUS_DOT = {
  upcoming:  'bg-blue-400',
  ongoing:   'bg-green-400',
  completed: 'bg-slate-400',
  cancelled: 'bg-red-300',
}

const STATUS_LABEL = {
  upcoming: '예정',
  ongoing: '진행중',
  completed: '완료',
  cancelled: '취소',
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getTrips({}).then(data => {
      setTrips(data || [])
      setLoading(false)
    })
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const getTripsForDay = (day) =>
    trips.filter(trip => {
      if (!trip.depart_date || !trip.return_date) return false
      const start = parseISO(trip.depart_date)
      const end = parseISO(trip.return_date)
      return isWithinInterval(day, { start, end })
    })

  const tripsThisMonth = trips.filter(trip => {
    if (!trip.depart_date) return false
    const d = parseISO(trip.depart_date)
    return isSameMonth(d, currentDate)
  })

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">일정 달력</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {format(currentDate, 'yyyy년 M월', { locale: ko })} · 출발 여행{' '}
            <span className="font-semibold text-slate-700">{tripsThisMonth.length}건</span>
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
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-slate-800 w-28 text-center select-none">
              {format(currentDate, 'yyyy년 M월', { locale: ko })}
            </span>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              aria-label="다음 달"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
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
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent mr-2" />
            불러오는 중...
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {days.map((day, idx) => {
              const dayTrips = getTripsForDay(day)
              const inMonth = isSameMonth(day, currentDate)
              const todayFlag = isToday(day)
              const isSun = day.getDay() === 0
              const isSat = day.getDay() === 6
              const isRowStart = idx % 7 === 0
              const MAX_SHOW = 3

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[90px] md:min-h-[110px] p-1.5 border-b border-slate-100 ${
                    !inMonth ? 'bg-slate-50/60' : ''
                  }`}
                >
                  {/* 날짜 숫자 */}
                  <div className="flex items-center justify-end mb-1">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        todayFlag
                          ? 'bg-brand text-white font-bold'
                          : !inMonth
                          ? 'text-slate-300'
                          : isSun
                          ? 'text-red-500'
                          : isSat
                          ? 'text-blue-500'
                          : 'text-slate-600'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* 여행 이벤트 */}
                  <div className="space-y-0.5">
                    {dayTrips.slice(0, MAX_SHOW).map(trip => (
                      <Link
                        key={trip.id}
                        to={`/trips/${trip.id}`}
                        title={`${trip.title} (${trip.depart_date} ~ ${trip.return_date})`}
                        className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border truncate transition hover:opacity-80 ${
                          STATUS_STYLE[trip.status] ?? STATUS_STYLE.upcoming
                        }`}
                      >
                        {isSameDay(day, parseISO(trip.depart_date)) && (
                          <span className="shrink-0 text-[9px] font-bold opacity-70">출</span>
                        )}
                        {isSameDay(day, parseISO(trip.return_date)) && (
                          <span className="shrink-0 text-[9px] font-bold opacity-70">귀</span>
                        )}
                        <span className="truncate">{trip.title}</span>
                      </Link>
                    ))}
                    {dayTrips.length > MAX_SHOW && (
                      <p className="text-[10px] text-slate-400 px-1">
                        +{dayTrips.length - MAX_SHOW}개 더
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 범례 + 이번 달 여행 목록 */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 범례 */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">범례</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`inline-block w-3 h-3 rounded-sm border ${STATUS_STYLE[key]}`} />
                <span className="text-xs text-slate-600">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            셀 왼쪽 <span className="font-semibold">출</span> = 출발일 &nbsp;·&nbsp;{' '}
            <span className="font-semibold">귀</span> = 귀국일
          </p>
        </div>

        {/* 이번 달 여행 목록 */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            {format(currentDate, 'M월', { locale: ko })} 출발 여행
          </p>
          {tripsThisMonth.length === 0 ? (
            <p className="text-sm text-slate-400">이번 달 출발 여행이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {tripsThisMonth
                .sort((a, b) => a.depart_date.localeCompare(b.depart_date))
                .map(trip => (
                  <Link
                    key={trip.id}
                    to={`/trips/${trip.id}`}
                    className="flex items-center gap-2.5 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition"
                  >
                    <span className={`shrink-0 w-2 h-2 rounded-full ${STATUS_DOT[trip.status]}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{trip.title}</p>
                      <p className="text-xs text-slate-400">
                        {trip.depart_date} ~ {trip.return_date}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
