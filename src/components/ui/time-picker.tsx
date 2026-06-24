import { useState, useRef, useEffect } from 'react'

interface TimePickerProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  disabled?: boolean
  size?: 'default' | 'sm'
  className?: string
}

function focusNextInput(el: HTMLElement) {
  const all = Array.from(document.querySelectorAll<HTMLElement>(
    'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
  ))
  const idx = all.indexOf(el)
  if (idx !== -1 && idx + 1 < all.length) all[idx + 1].focus()
}

export function TimePicker({
  value, onChange, disabled, size = 'default', className,
}: TimePickerProps) {
  const [hh, setHh] = useState(() => value?.split(':')[0] ?? '')
  const [mm, setMm] = useState(() => value?.split(':')[1] ?? '')
  const hhRef = useRef<HTMLInputElement>(null)
  const mmRef = useRef<HTMLInputElement>(null)

  // digit-entry counters: reset to 0 on focus
  const hhCount = useRef(0)
  const mmCount = useRef(0)
  // first digit storage
  const hhFirst = useRef('')
  const mmFirst = useRef('')
  // pending value refs: updated synchronously with every setHh/setMm call so
  // blur handlers always read the latest intended value, not a stale closure.
  const hhPending = useRef(value?.split(':')[0] ?? '')
  const mmPending = useRef(value?.split(':')[1] ?? '')

  useEffect(() => {
    const [h = '', m = ''] = (value ?? '').split(':')
    hhPending.current = h
    mmPending.current = m
    setHh(h)
    setMm(m)
  }, [value])

  function commit(h: string, m: string) {
    if (h.length === 2 && m.length === 2) onChange(`${h}:${m}`)
  }

  // ─── HH ───────────────────────────────────────────────────────────────────

  function handleHhFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select()
    hhCount.current = 0
    hhFirst.current = ''
  }

  function handleHhKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      hhCount.current = 0
      hhFirst.current = ''
      hhPending.current = ''
      setHh('')
      if (!mm) onChange('')
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      mmRef.current?.focus()
      mmRef.current?.select()
      return
    }
    if (!/^[0-9]$/.test(e.key)) return
    e.preventDefault()

    const digit = e.key
    if (hhCount.current === 0) {
      // 3 이상이면 앞에 0 자동 추가 후 MM으로 이동
      if (Number(digit) > 2) {
        const val = '0' + digit
        hhPending.current = val
        setHh(val)
        hhCount.current = 0
        hhFirst.current = ''
        commit(val, mm)
        mmRef.current?.focus()
        mmRef.current?.select()
      } else {
        hhFirst.current = digit
        hhPending.current = digit
        setHh(digit)
        hhCount.current = 1
      }
    } else {
      // 두 번째 자리
      const combined = hhFirst.current + digit
      const val = Math.min(Number(combined), 23).toString().padStart(2, '0')
      hhPending.current = val
      setHh(val)
      hhCount.current = 0
      hhFirst.current = ''
      commit(val, mm)
      mmRef.current?.focus()
      mmRef.current?.select()
    }
  }

  function handleHhBlur() {
    hhCount.current = 0
    hhFirst.current = ''
    // hhPending.current reflects the latest intended value (set synchronously in keydown),
    // avoiding the stale-closure problem where setHh() hasn't flushed yet.
    const curHh = hhPending.current
    if (!curHh && !mm) { onChange(''); return }
    if (!curHh) return
    const val = Math.min(Number(curHh), 23).toString().padStart(2, '0')
    hhPending.current = val
    setHh(val)
    commit(val, mm)
  }

  // ─── MM ───────────────────────────────────────────────────────────────────

  function handleMmFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select()
    mmCount.current = 0
    mmFirst.current = ''
  }

  function handleMmKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      mmCount.current = 0
      mmFirst.current = ''
      mmPending.current = ''
      setMm('')
      commit(hh, '')
      return
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      hhRef.current?.focus()
      hhRef.current?.select()
      return
    }
    if (!/^[0-9]$/.test(e.key)) return
    e.preventDefault()

    const digit = e.key
    if (mmCount.current === 0) {
      // 6 이상이면 앞에 0 자동 추가
      if (Number(digit) > 5) {
        const val = '0' + digit
        mmPending.current = val
        setMm(val)
        mmCount.current = 0
        mmFirst.current = ''
        commit(hh, val)
        if (mmRef.current) focusNextInput(mmRef.current)
      } else {
        mmFirst.current = digit
        mmPending.current = digit
        setMm(digit)
        mmCount.current = 1
      }
    } else {
      const combined = mmFirst.current + digit
      const val = Math.min(Number(combined), 59).toString().padStart(2, '0')
      mmPending.current = val
      setMm(val)
      mmCount.current = 0
      mmFirst.current = ''
      commit(hh, val)
      if (mmRef.current) focusNextInput(mmRef.current)
    }
  }

  function handleMmBlur() {
    mmCount.current = 0
    mmFirst.current = ''
    const curMm = mmPending.current
    if (!hh && !curMm) { onChange(''); return }
    if (!curMm) return
    const val = Math.min(Number(curMm), 59).toString().padStart(2, '0')
    mmPending.current = val
    setMm(val)
    commit(hh, val)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const sm = size === 'sm'
  const inputCls = [
    'w-7 bg-transparent text-center tabular-nums outline-none',
    'placeholder:text-slate-300 font-medium text-slate-800',
    sm ? 'text-xs' : 'text-sm',
  ].join(' ')

  return (
    <div className={[
      'flex items-center rounded-md border bg-white transition-all',
      sm ? 'px-2 py-1 gap-0.5 min-h-[28px]' : 'px-3 py-2 gap-1',
      disabled
        ? 'cursor-not-allowed opacity-50 border-slate-200'
        : 'border-slate-200 hover:border-slate-300 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand',
      className ?? '',
    ].join(' ')}>
      <input
        ref={hhRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={hh}
        onChange={() => {}}
        onKeyDown={handleHhKeyDown}
        onFocus={handleHhFocus}
        onBlur={handleHhBlur}
        placeholder="HH"
        disabled={disabled}
        className={inputCls}
      />
      <span className={`text-slate-300 select-none ${sm ? 'text-xs' : 'text-sm'}`}>:</span>
      <input
        ref={mmRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={mm}
        onChange={() => {}}
        onKeyDown={handleMmKeyDown}
        onFocus={handleMmFocus}
        onBlur={handleMmBlur}
        placeholder="MM"
        disabled={disabled}
        className={inputCls}
      />
      {(hh || mm) && !disabled && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => { setHh(''); setMm(''); hhPending.current = ''; mmPending.current = ''; onChange('') }}
          className="ml-0.5 text-slate-300 hover:text-slate-500 transition leading-none text-base"
        >
          ×
        </button>
      )}
    </div>
  )
}
