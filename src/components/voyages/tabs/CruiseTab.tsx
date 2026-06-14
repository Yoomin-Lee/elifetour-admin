import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { fetchVoyages } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'

export default function CruiseTab() {
  const [filter, setFilter] = useState('')
  const { data: voyages = [], isLoading } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const filtered = voyages.filter(v =>
    !filter ||
    voyageTitle(v).toLowerCase().includes(filter.toLowerCase()) ||
    (v.cruise_line ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    (v.ship_name ?? '').toLowerCase().includes(filter.toLowerCase())
  )

  const active = filtered.filter(v => v.status !== '취소')
  const cancelled = filtered.filter(v => v.status === '취소')
  const ordered = [...active, ...cancelled]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">크루즈</h1>
          <p className="text-sm text-slate-400">캐빈 현황 조회</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="행사명·선사·크루즈 검색"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[900px] w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">승선일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">하선일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">선사</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-28">크루즈</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-16">보유</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-16">예약</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-16">잔여</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
            )}
            {!isLoading && ordered.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
            )}
            {ordered.map(v => {
              const reserved = v.cabin_total - v.cabin_remaining
              const isCancelled = v.status === '취소'
              return (
                <tr key={v.id} className={['hover:bg-slate-50', isCancelled ? 'opacity-50' : ''].join(' ')}>
                  <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                    {isCancelled
                      ? <span className="line-through text-slate-400">{voyageTitle(v)}</span>
                      : voyageTitle(v)}
                  </td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(v.departure_date)}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{v.return_date ? formatDate(v.return_date) : '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{v.cruise_line ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{v.ship_name ?? '—'}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{v.cabin_total}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{reserved}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={v.cabin_remaining === 0 ? 'text-red-500 font-medium' : 'text-slate-700'}>
                      {v.cabin_remaining}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
