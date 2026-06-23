import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Option = { value: string; label?: string }

type Props = {
  value: string
  options: (string | Option)[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  defaultOpen?: boolean
}

export function FieldSelect({ value, options, onChange, placeholder, className, defaultOpen }: Props) {
  const [open, setOpen] = useState(defaultOpen ?? false)

  const normalized: Option[] = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o,
  )

  const current = normalized.find(o => o.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex w-full h-9 items-center justify-between gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand',
          !current && 'text-slate-400',
          className,
        )}
      >
        <span className="truncate">{current?.label ?? current?.value ?? placeholder ?? '선택'}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-full max-h-52 overflow-y-auto scrollbar-navy rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {normalized.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition hover:bg-slate-50"
              >
                <span className={cn(o.value === value ? 'font-semibold text-brand' : 'text-slate-700')}>
                  {o.label ?? o.value}
                </span>
                {o.value === value && <Check className="h-3.5 w-3.5 text-brand" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
