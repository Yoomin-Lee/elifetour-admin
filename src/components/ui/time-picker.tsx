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

  useEffect(() => {
    const [h = '', m = ''] = (value ?? '').split(':')
    setHh(h)
    setMm(m)
  }, [value])

  function commit(h: string, m: string) {
    if (h.length === 2 && m.length === 2) onChange(`${h}:${m}`)
  }

  function handleHh(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
    // 첫 자리가 3 이상이면 앞에 0 자동 추가
    if (raw.length === 1 && Number(raw) > 2) {
      const padded = '0' + raw
      setHh(padded)
      mmRef.current?.focus()
      mmRef.current?.select()
      commit(padded, mm)
      return
    }
    setHh(raw)
    if (raw.length === 2) {
      const val = Math.min(Number(raw), 23).toString().padStart(2, '0')
      setHh(val)
      mmRef.current?.focus()
      mmRef.current?.select()
      commit(val, mm)
    }
  }

  function handleMm(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
    // 첫 자리가 6 이상이면 앞에 0 자동 추가
    if (raw.length === 1 && Number(raw) > 5) {
      const padded = '0' + raw
      setMm(padded)
      if (mmRef.current) focusNextInput(mmRef.current)
      commit(hh, padded)
      return
    }
    setMm(raw)
    if (raw.length === 2) {
      const val = Math.min(Number(raw), 59).toString().padStart(2, '0')
      setMm(val)
      if (mmRef.current) focusNextInput(mmRef.current)
      commit(hh, val)
    }
  }

  function handleHhBlur() {
    if (!hh && !mm) { onChange(''); return }
    if (!hh) return
    const val = Math.min(Number(hh), 23).toString().padStart(2, '0')
    setHh(val)
    commit(val, mm)
  }

  function handleMmBlur() {
    if (!hh && !mm) { onChange(''); return }
    if (!mm) return
    const val = Math.min(Number(mm), 59).toString().padStart(2, '0')
    setMm(val)
    commit(hh, val)
  }

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
        onChange={handleHh}
        onBlur={handleHhBlur}
        onFocus={e => e.target.select()}
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
        onChange={handleMm}
        onBlur={handleMmBlur}
        onFocus={e => e.target.select()}
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
