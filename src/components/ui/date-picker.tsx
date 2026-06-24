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

function focusNextInput(el: HTMLElement) {
  const all = Array.from(document.querySelectorAll<HTMLElement>(
    'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
  ))
  const idx = all.indexOf(el)
  if (idx !== -1 && idx + 1 < all.length) all[idx + 1].focus()
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
  // null = 보기 모드, string = 숫자 빠른 입력 중 (YYMMDD)
  const [quickEntry, setQuickEntry] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // 선택된 날짜가 외부에서 바뀌면 캘린더 뷰도 동기화
  useEffect(() => {
    if (value) setViewDate(parseISO(value))
  }, [value])

  const sm = size === 'sm'
  const displayDate = value
    ? (sm ? format(parseISO(value), 'yy/MM/dd') : format(parseISO(value), 'yyyy년 M월 d일 (EEE)', { locale: ko }))
    : ''

  // ─── 빠른 숫자 입력: YYMMDD → YYYY-MM-DD ──────────────────────────────────

  function tryConvert(entry: string) {
    const year  = 2000 + Number(entry.slice(0, 2))
    const month = Number(entry.slice(2, 4))
    const day   = Number(entry.slice(4, 6))
    const date  = new Date(year, month - 1, day)
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      onChange(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
      setViewDate(date)
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      setQuickEntry(prev => (prev !== null && prev.length > 0) ? prev.slice(0, -1) : prev)
      return
    }
    if (e.key === 'Escape') {
      setQuickEntry(null)
      inputRef.current?.blur()
      return
    }
    if (!/^[0-9]$/.test(e.key)) return
    e.preventDefault()

    const newEntry = (quickEntry ?? '') + e.key
    setQuickEntry(newEntry)
    if (newEntry.length === 6) {
      tryConvert(newEntry)
      setQuickEntry(null)
      if (inputRef.current) focusNextInput(inputRef.current)
    }
  }

  function handleInputFocus() {
    setQuickEntry('')
    setOpen(false)
  }

  function handleInputBlur() {
    setQuickEntry(null)
  }

  function handleCalendarClick(e: React.MouseEvent) {
    e.preventDefault()
    if (!disabled) setOpen(v => !v)
  }

  // ─── 달력 ─────────────────────────────────────────────────────────────────

  const monthStart = startOfMonth(viewDate)
  const monthEnd   = endOfMonth(viewDate)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end:   endOfWeek(monthEnd,   { weekStartsOn: 0 }),
  })

  function selectDay(day: Date) {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
    if (inputRef.current) focusNextInput(inputRef.current)
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

  const inputDisplayValue = quickEntry !== null ? quickEntry : displayDate

  return (
    <div ref={containerRef} className="relative">
      {/* 트리거: 텍스트 입력 + 달력 아이콘 */}
      <div className={[
        'flex w-full items-center rounded-md border transition-all',
        'border-slate-200 bg-white',
        sm ? 'gap-1 px-2 py-1 min-h-[28px]' : 'gap-2 px-3 py-2',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:border-slate-300 hover:shadow-sm focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:shadow-sm',
        (open && !disabled) ? 'border-brand ring-1 ring-brand shadow-sm' : '',
      ].join(' ')}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputDisplayValue}
          onChange={() => {}}
          onKeyDown={!disabled ? handleInputKeyDown : undefined}
          onFocus={!disabled ? handleInputFocus : undefined}
          onBlur={handleInputBlur}
          placeholder={quickEntry !== null ? 'YYMMDD' : placeholder}
          disabled={disabled}
          className={[
            'min-w-0 flex-1 bg-transparent outline-none truncate',
            'placeholder:text-slate-400',
            inputDisplayValue ? 'font-medium text-slate-800 tabular-nums' : 'text-slate-400',
            sm ? 'text-xs' : 'text-sm',
          ].join(' ')}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={handleCalendarClick}
          className="shrink-0 flex items-center"
        >
          <Calendar className={`transition-colors ${sm ? 'h-3 w-3' : 'h-4 w-4'} ${open ? 'text-brand' : 'text-slate-300'}`} />
        </button>
      </div>

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
