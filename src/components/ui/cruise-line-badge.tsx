const CRUISE_MAP: { match: string[]; label: string; className: string }[] = [
  {
    match: ['costa'],
    label: 'COSTA',
    className: 'bg-amber-50 text-amber-600 border border-amber-200',
  },
  {
    match: ['royal', 'caribbean'],
    label: 'ROYAL',
    className: 'bg-sky-50 text-sky-600 border border-sky-200',
  },
  {
    match: ['holland', 'hal'],
    label: 'HAL',
    className: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
  },
  {
    match: ['msc'],
    label: 'MSC',
    className: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  {
    match: ['norwegian', 'ncl'],
    label: 'NCL',
    className: 'bg-orange-50 text-orange-600 border border-orange-200',
  },
  {
    match: ['princess'],
    label: 'PRINCESS',
    className: 'bg-rose-50 text-rose-500 border border-rose-200',
  },
]

function getBadge(cruiseLine: string | null | undefined) {
  if (!cruiseLine) return null
  const lower = cruiseLine.toLowerCase()
  return CRUISE_MAP.find(c => c.match.some(m => lower.includes(m))) ?? null
}

export function CruiseLineBadge({ value }: { value: string | null | undefined }) {
  const badge = getBadge(value)
  if (!badge) return <span className="text-slate-500">{value ?? '—'}</span>
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  )
}
