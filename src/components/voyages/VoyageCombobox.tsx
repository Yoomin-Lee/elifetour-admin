import { useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CruiseLineBadge } from '@/components/ui/cruise-line-badge'
import { cn } from '@/lib/utils'
import { voyageTitle } from '@/types/database'
import type { Voyage } from '@/types/database'

interface Props {
  voyages: Voyage[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
}

function airlineLabel(v: Voyage): string | null {
  const a = v.airline?.trim() || null
  const b = v.airline_return?.trim() || null
  if (!a && !b) return null
  if (a && b) return `${a} / ${b}`
  return a ?? b
}

export default function VoyageCombobox({ voyages, selectedId, onSelect, loading }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = voyages.find(v => v.id === selectedId)
  const filtered = voyages.filter(v =>
    voyageTitle(v).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-72 justify-between font-normal"
          disabled={loading}
        >
          <span className={cn('truncate', !selected && 'text-slate-400')}>
            {loading ? '로딩 중…' : selected ? voyageTitle(selected) : '행사를 선택하세요'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80">
        {/* 검색창 */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="행사 검색…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {/* 목록 */}
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">결과 없음</p>
          ) : (
            filtered.map(v => (
              <button
                key={v.id}
                onClick={() => { onSelect(v.id); setOpen(false); setSearch('') }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors text-left',
                  v.id === selectedId && 'bg-brand-50 text-brand font-medium'
                )}
              >
                <Check className={cn('h-4 w-4 shrink-0', v.id === selectedId ? 'opacity-100 text-brand' : 'opacity-0')} />
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{voyageTitle(v)}</span>
                  {airlineLabel(v) && (
                    <span className="block text-xs text-slate-400 font-normal">{airlineLabel(v)}</span>
                  )}
                </span>
                <CruiseLineBadge value={v.cruise_line} />
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
