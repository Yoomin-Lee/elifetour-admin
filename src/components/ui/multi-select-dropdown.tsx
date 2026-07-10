import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** 여러 개 선택 가능한 드롭다운 — 선택 없음(빈 배열)은 "전체"를 의미 */
export function MultiSelectDropdown({
  allLabel, options, selected, onChange, formatOption,
}: {
  allLabel: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
  formatOption?: (opt: string) => string
}) {
  const [open, setOpen] = useState(false)

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt])
  }

  const fmt = (opt: string) => formatOption ? formatOption(opt) : opt
  const buttonLabel = selected.length === 0
    ? allLabel
    : selected.length === 1
      ? fmt(selected[0])
      : `${fmt(selected[0])} 외 ${selected.length - 1}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('h-9 gap-1.5 font-medium', selected.length > 0 ? 'border-brand/40 text-brand bg-brand/5' : 'text-slate-700')}
        >
          <span className="whitespace-nowrap">{buttonLabel}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', open && 'rotate-180')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 max-h-[240px] overflow-y-auto py-1">
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-slate-50',
            selected.length === 0 ? 'font-semibold text-brand' : 'text-slate-700',
          )}
        >
          <Check className={cn('h-3.5 w-3.5 shrink-0', selected.length === 0 ? 'opacity-100' : 'opacity-0')} />
          {allLabel}
        </button>
        <div className="my-1 border-t border-slate-100" />
        {options.map(opt => {
          const checked = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-slate-50',
                checked ? 'font-semibold text-brand' : 'text-slate-700',
              )}
            >
              <Check className={cn('h-3.5 w-3.5 shrink-0', checked ? 'opacity-100' : 'opacity-0')} />
              {fmt(opt)}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
