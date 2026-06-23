import { useState, useRef, useEffect } from 'react'
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths,
  setYear, getYear,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar, ChevronDown } from 'lucide-react'

interface DatePickerProps {
  value: string            // YYYY-MM-DD or ''
  onChange: (val: string) => void
  placeholder?: string
  disabled?: boolean
  size?: 'default' | 'sm'
}

const WEEK_DAYS = ['일','월','화','수','목','금','토']
const YEARS_PER_PAGE = 12

export function DatePicker({ value, onChange, placeholder = '날짜 선택', disabled, size = 'default' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => value ? parseISO(value) : new Date())
  const [yearMode, setYearMode] = useState(false)
  const [yearPage, setYearPage] = useState(() => {
    const y = (value ? parseISO(value) : new Date()).getFullYear()
    return Math.floor(y / YEARS_PER_PAGE) * YEARS_PER_PAGE
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (!open) setYearMode(false)
  }, [open])

  const sm = size === 'sm'
  const displayDate = value
    ? (sm ? format(parseISO(value), 'yy/MM/dd') : format(parseISO(value), 'yyyy년 M월 d일 (EEE)', { locale: ko }))
    : ''

  const monthStart = startOfMonth(viewDate)
  const monthEnd   = endOfMonth(viewDate)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end:   endOfWeek(monthEnd,   { weekStartsOn: 0 }),
  })

  function selectDay(day: Date) {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  function enterYearMode() {
    const y = getYear(viewDate)
    setYearPage(Math.floor(y / YEARS_PER_PAGE) * YEARS_PER_PAGE)
    setYearMode(v => !v)
  }

  function selectYearFn(year: number) {
    setViewDate(d => setYear(d, year))
    setYearMode(false)
  }

  const viewYear = getYear(viewDate)
  const todayYear = getYear(new Date())
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPage + i)

  return (
    <div ref={containerRef} className="relative">
      {/* 트리거 버튼 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={[
          'flex w-full items-center justify-between rounded-md border transition-all',
          'border-slate-200 bg-white text-left',
          sm ? 'gap-1 px-2 py-1 text-xs min-h-[28px]' : 'gap-2 px-3 py-2 text-sm',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-slate-300 hover:shadow-sm',
          open ? 'border-brand ring-1 ring-brand shadow-sm' : '',
        ].join(' ')}
      >
        <span className={`min-w-0 truncate ${value ? 'font-medium text-slate-800 tabular-nums' : 'text-slate-400'}`}>
          {displayDate || placeholder}
        </span>
        <Calendar className={`shrink-0 transition-colors ${sm ? 'h-3 w-3' : 'h-4 w-4'} ${open ? 'text-brand' : 'text-slate-300'}`} />
      </button>

      {/* 달력 팝오버 */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[268px] rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 overflow-hidden">
          {/* 월/연도 네비게이션 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => yearMode ? setYearPage(y => y - YEARS_PER_PAGE) : setViewDate(d => subMonths(d, 1))}
              className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={enterYearMode}
              className="flex items-center gap-1 text-sm font-semibold text-slate-800 hover:text-brand transition tabular-nums"
            >
              {yearMode
                ? `${yearPage} – ${yearPage + YEARS_PER_PAGE - 1}`
                : format(viewDate, 'yyyy년 M월', { locale: ko })}
              <ChevronDown className={`h-3 w-3 transition-transform ${yearMode ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => yearMode ? setYearPage(y => y + YEARS_PER_PAGE) : setViewDate(d => addMonths(d, 1))}
              className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {yearMode ? (
            /* 연도 선택 그리드 */
            <div className="p-3 grid grid-cols-4 gap-1">
              {years.map(year => (
                <button
                  key={year}
                  type="button"
                  onClick={() => selectYearFn(year)}
                  className={[
                    'rounded-lg py-2.5 text-xs font-medium transition-all',
                    year === viewYear
                      ? 'bg-brand text-white shadow-sm'
                      : year === todayYear
                      ? 'bg-brand/10 text-brand ring-1 ring-brand/30'
                      : 'text-slate-700 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-1.5">
                {WEEK_DAYS.map((d, i) => (
                  <div key={d} className={`text-center text-[10px] font-semibold tracking-wide py-1 ${
                    i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'
                  }`}>{d}</div>
                ))}
              </div>

              {/* 날짜 셀 */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {days.map(day => {
                  const inMonth  = isSameMonth(day, viewDate)
                  const selected = value ? isSameDay(day, parseISO(value)) : false
                  const todayFlg = isToday(day)
                  const isSun    = day.getDay() === 0
                  const isSat    = day.getDay() === 6

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={[
                        'mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all',
                        selected
                          ? 'bg-brand text-white shadow-sm'
                          : todayFlg
                          ? 'bg-brand/10 text-brand ring-1 ring-brand/30'
                          : !inMonth
                          ? 'text-slate-200 pointer-events-none'
                          : isSun
                          ? 'text-red-400 hover:bg-red-50'
                          : isSat
                          ? 'text-blue-500 hover:bg-blue-50'
                          : 'text-slate-700 hover:bg-slate-100',
                      ].join(' ')}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 하단 버튼 (달력 모드에서만) */}
          {!yearMode && (
            <div className="px-3 pb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => { setViewDate(new Date()); selectDay(new Date()) }}
                className="flex-1 text-center text-xs text-brand hover:text-brand-dark font-medium py-1.5 rounded-lg hover:bg-brand/5 transition"
              >
                오늘
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false) }}
                  className="flex-1 text-center text-xs text-slate-400 hover:text-slate-600 py-1.5 rounded-lg hover:bg-slate-50 transition"
                >
                  초기화
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
