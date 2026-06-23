const CRUISE_MAP: { match: string[]; label: string; className: string }[] = [
  {
    match: ['costa'],
    label: 'COSTA',
    className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  },
  {
    match: ['royal', 'caribbean'],
    label: 'ROYAL',
    className: 'bg-sky-100 text-sky-700 border border-sky-200',
  },
  {
    match: ['holland', 'hal'],
    label: 'HAL',
    className: 'bg-indigo-700 text-white border border-indigo-800',
  },
  {
    match: ['msc'],
    label: 'MSC',
    className: 'bg-green-100 text-green-700 border border-green-200',
  },
  {
    match: ['norwegian', 'ncl'],
    label: 'NCL',
    className: 'bg-orange-100 text-orange-700 border border-orange-200',
  },
  {
    match: ['princess'],
    label: 'PRINCESS',
    className: 'bg-pink-100 text-pink-700 border border-pink-200',
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
