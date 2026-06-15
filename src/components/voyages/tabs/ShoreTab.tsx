import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { fetchAllItinerary } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate, formatTime } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  '크루즈':   'bg-blue-50 text-blue-700',
  '항공':     'bg-sky-50 text-sky-700',
  '호텔':     'bg-amber-50 text-amber-700',
  '지상':     'bg-green-50 text-green-700',
  '식사':     'bg-orange-50 text-orange-700',
}

export default function ShoreTab() {
  const [filter, setFilter] = useState('')
  const { data = [], isLoading } = useQuery({
    queryKey: ['all-itinerary'],
    queryFn: fetchAllItinerary,
  })

  const filtered = [...data]
    .filter(r =>
      !filter ||
      (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
      (r.port ?? '').toLowerCase().includes(filter.toLowerCase()) ||
      (r.category ?? '').includes(filter)
    )
    .sort((a, b) => {
      const aVoy = a.voyages?.departure_date ?? ''
      const bVoy = b.voyages?.departure_date ?? ''
      const voyDiff = bVoy.localeCompare(aVoy)
      if (voyDiff !== 0) return voyDiff
      return b.date.localeCompare(a.date)
    })

  function currencySymbol(c: string | null) {
    if (c === 'KRW') return '₩'
    if (c === 'EUR') return '€'
    if (c === 'SGD') return 'S$'
    return '$'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">지상</h1>
          <p className="text-sm text-slate-400">기항지 일정 전체 {data.length}건</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="행사명·기항지·구분 검색"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[950px] w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">날짜</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-28">기항지</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16">입항</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16">출항</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">구분</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-24">비용</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                  {r.voyages ? voyageTitle(r.voyages) : '—'}
                </td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
                <td className="px-3 py-2 text-slate-700 font-medium">{r.port}</td>
                <td className="px-3 py-2 font-mono text-slate-600">
                  {r.arrival_time ? formatTime(r.arrival_time) : '—'}
                </td>
                <td className="px-3 py-2 font-mono text-slate-600">
                  {r.departure_time ? formatTime(r.departure_time) : '—'}
                </td>
                <td className="px-3 py-2">
                  {r.category ? (
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[r.category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {r.category}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2 text-right text-slate-700">
                  {r.cost
                    ? `${currencySymbol(r.cost_currency)}${r.cost.toLocaleString()}`
                    : '—'}
                </td>
                <td className="px-3 py-2 text-slate-500">{r.summary ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
