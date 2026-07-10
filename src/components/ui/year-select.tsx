import { useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClickOutside } from '@/hooks/useClickOutside'

type Props = {
  value: string
  years: string[]
  onChange: (year: string) => void
  className?: string
}

const PANEL_HEIGHT_ESTIMATE = 240 + 8 // max-h + margin

export function YearSelect({ value, years, onChange, className }: Props) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useClickOutside(rootRef, open, () => setOpen(false))

  function handleToggle() {
    if (!open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setOpenUp(spaceBelow < PANEL_HEIGHT_ESTIMATE && spaceAbove > spaceBelow)
    }
    setOpen(v => !v)
  }

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:border-brand/50 hover:bg-brand/5 focus:outline-none focus:ring-1 focus:ring-brand',
          className,
        )}
      >
        <span className="min-w-[52px] text-center font-medium">
          {value === 'ALL' ? '전체 연도' : `${value}년`}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className={cn(
          'absolute left-0 z-20 min-w-full max-h-[240px] overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg',
          openUp ? 'bottom-full mb-1' : 'top-full mt-1',
        )}>
          <button
            type="button"
            onClick={() => { onChange('ALL'); setOpen(false) }}
            className={cn(
              'flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left text-sm transition hover:bg-slate-50',
              value === 'ALL' ? 'font-semibold text-brand' : 'text-slate-700',
            )}
          >
            <Check className={cn('h-3.5 w-3.5 shrink-0', value === 'ALL' ? 'opacity-100' : 'opacity-0')} />
            전체 연도
          </button>
          <div className="my-1 border-t border-slate-100" />
          {years.map(y => (
            <button
              key={y}
              type="button"
              onClick={() => { onChange(y); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left text-sm transition hover:bg-slate-50',
                value === y ? 'font-semibold text-brand' : 'text-slate-700',
              )}
            >
              <Check className={cn('h-3.5 w-3.5 shrink-0', value === y ? 'opacity-100' : 'opacity-0')} />
              {y}년
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
