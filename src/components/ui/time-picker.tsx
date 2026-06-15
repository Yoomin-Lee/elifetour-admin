import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface TimePickerProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  disabled?: boolean
  size?: 'default' | 'sm'
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

export function TimePicker({
  value, onChange, placeholder = '시간', disabled, size = 'default', className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hourRef = useRef<HTMLDivElement>(null)
  const minRef = useRef<HTMLDivElement>(null)

  const [selHour, selMin] = value ? value.split(':') : ['', '']

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const scroll = (ref: React.RefObject<HTMLDivElement | null>, val: string) => {
      setTimeout(() => {
        const el = ref.current?.querySelector(`[data-val="${val}"]`) as HTMLElement | null
        el?.scrollIntoView({ block: 'center', behavior: 'instant' })
      }, 20)
    }
    if (selHour) scroll(hourRef, selHour)
    if (selMin) scroll(minRef, selMin)
  }, [open])

  function pick(h: string, m: string) {
    onChange(`${h}:${m}`)
  }

  const sm = size === 'sm'

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
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
        <span className={value ? 'font-medium text-slate-800 tabular-nums' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <Clock className={`shrink-0 transition-colors ${sm ? 'h-3 w-3' : 'h-4 w-4'} ${open ? 'text-brand' : 'text-slate-300'}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[144px] rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <div className="flex-1 py-1.5 text-center text-[10px] font-semibold text-slate-400 tracking-wide">시</div>
            <div className="w-px bg-slate-100" />
            <div className="flex-1 py-1.5 text-center text-[10px] font-semibold text-slate-400 tracking-wide">분</div>
          </div>

          <div className="flex h-[176px]">
            <div ref={hourRef} className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'none' }}>
              {HOURS.map(h => (
                <button
                  key={h}
                  type="button"
                  data-val={h}
                  onClick={() => pick(h, selMin || '00')}
                  className={[
                    'w-full py-1.5 text-center text-xs font-medium transition-colors',
                    h === selHour ? 'bg-brand text-white' : 'text-slate-700 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="w-px bg-slate-100" />
            <div ref={minRef} className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'none' }}>
              {MINUTES.map(m => (
                <button
                  key={m}
                  type="button"
                  data-val={m}
                  onClick={() => pick(selHour || '00', m)}
                  className={[
                    'w-full py-1.5 text-center text-xs font-medium transition-colors',
                    m === selMin ? 'bg-brand text-white' : 'text-slate-700 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {value && (
            <div className="border-t border-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className="w-full rounded-lg py-1 text-center text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
              >
                초기화
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
