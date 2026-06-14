import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { fetchAllHotels } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'

function calcDDay(departure: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dep = new Date(departure); dep.setHours(0, 0, 0, 0)
  const diff = Math.round((dep.getTime() - today.getTime()) / 86_400_000)
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return 'D-day'
  return `D+${Math.abs(diff)}`
}

export default function HotelTab() {
  const [filter, setFilter] = useState('')
  const { data = [], isLoading } = useQuery({
    queryKey: ['all-hotels'],
    queryFn: fetchAllHotels,
  })

  const filtered = data.filter(r =>
    !filter ||
    (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
    r.hotel_name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">호텔</h1>
          <p className="text-sm text-slate-400">전체 {data.length}건</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="행사명·호텔명 검색"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {data.length === 0 && !isLoading && (
        <div className="rounded-lg border-2 border-dashed border-slate-200 py-16 text-center text-slate-400">
          <p className="text-sm">등록된 호텔 정보가 없습니다</p>
          <p className="mt-1 text-xs">행사 등록 시 호텔 정보를 함께 입력할 수 있습니다</p>
        </div>
      )}

      {(data.length > 0 || isLoading) && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[700px] w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">투숙일</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">호텔</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-24">객실요금</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-16">D-DAY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                    {r.voyages ? voyageTitle(r.voyages) : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(r.stay_date)}</td>
                  <td className="px-3 py-2 text-slate-700 font-medium">{r.hotel_name}</td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {r.room_rate
                      ? `${r.currency === 'KRW' ? '₩' : r.currency === 'EUR' ? '€' : r.currency === 'SGD' ? 'S$' : '$'}${r.room_rate.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-600">
                    {r.voyages ? calcDDay(r.voyages.departure_date) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
