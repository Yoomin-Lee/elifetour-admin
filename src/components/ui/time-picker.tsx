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

  // digit-entry counters: reset to 0 on focus, incremented per digit pressed
  const hhCount = useRef(0)
  const mmCount = useRef(0)
  // stores the first digit entered so we can combine without stale-closure issues
  const hhFirst = useRef('')
  const mmFirst = useRef('')
  // skip blur normalization when focus moves programmatically (avoids stale-closure overwrite)
  const skipHhBlur = useRef(false)
  const skipMmBlur = useRef(false)

  useEffect(() => {
    const [h = '', m = ''] = (value ?? '').split(':')
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
  }

  function handleHhKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      hhCount.current = 0
      hhFirst.current = ''
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
        setHh(val)
        hhCount.current = 0
        hhFirst.current = ''
        commit(val, mm)
        skipHhBlur.current = true
        mmRef.current?.focus()
        mmRef.current?.select()
      } else {
        hhFirst.current = digit
        setHh(digit)
        hhCount.current = 1
      }
    } else {
      // 두 번째 자리
      const combined = hhFirst.current + digit
      const val = Math.min(Number(combined), 23).toString().padStart(2, '0')
      setHh(val)
      hhCount.current = 0
      hhFirst.current = ''
      commit(val, mm)
      skipHhBlur.current = true
      mmRef.current?.focus()
      mmRef.current?.select()
    }
  }

  function handleHhBlur() {
    if (skipHhBlur.current) { skipHhBlur.current = false; return }
    hhCount.current = 0
    hhFirst.current = ''
    if (!hh && !mm) { onChange(''); return }
    if (!hh) return
    const val = Math.min(Number(hh), 23).toString().padStart(2, '0')
    setHh(val)
    commit(val, mm)
  }

  // ─── MM ───────────────────────────────────────────────────────────────────

  function handleMmFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select()
    mmCount.current = 0
  }

  function handleMmKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      mmCount.current = 0
      mmFirst.current = ''
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
        setMm(val)
        mmCount.current = 0
        mmFirst.current = ''
        commit(hh, val)
        if (mmRef.current) { skipMmBlur.current = true; focusNextInput(mmRef.current) }
      } else {
        mmFirst.current = digit
        setMm(digit)
        mmCount.current = 1
      }
    } else {
      const combined = mmFirst.current + digit
      const val = Math.min(Number(combined), 59).toString().padStart(2, '0')
      setMm(val)
      mmCount.current = 0
      mmFirst.current = ''
      commit(hh, val)
      if (mmRef.current) { skipMmBlur.current = true; focusNextInput(mmRef.current) }
    }
  }

  function handleMmBlur() {
    if (skipMmBlur.current) { skipMmBlur.current = false; return }
    mmCount.current = 0
    mmFirst.current = ''
    if (!hh && !mm) { onChange(''); return }
    if (!mm) return
    const val = Math.min(Number(mm), 59).toString().padStart(2, '0')
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
          onClick={() => { setHh(''); setMm(''); onChange('') }}
          className="ml-0.5 text-slate-300 hover:text-slate-500 transition leading-none text-base"
        >
          ×
        </button>
      )}
    </div>
  )
}
