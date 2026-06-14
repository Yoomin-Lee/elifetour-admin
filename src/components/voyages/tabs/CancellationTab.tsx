import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { fetchAllCancellationPolicies } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'

export default function CancellationTab() {
  const [filter, setFilter] = useState('')
  const { data = [], isLoading } = useQuery({
    queryKey: ['all-cancellation'],
    queryFn: fetchAllCancellationPolicies,
  })

  const filtered = data.filter(r =>
    !filter ||
    (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
    (r.category ?? '').includes(filter)
  )

  function feeText(r: typeof data[0]): string {
    if (r.fee_description) return r.fee_description
    if (r.fee_type === 'percent' && r.fee_value != null) return `${r.fee_value}%`
    if (r.fee_type === 'fixed' && r.fee_value != null)
      return `${r.fee_unit ?? ''}${r.fee_value.toLocaleString()}`
    if (r.fee_type === 'free') return '무료'
    return '—'
  }

  function dRange(r: typeof data[0]): string {
    const s = r.start_d_minus != null ? `D-${r.start_d_minus}` : '~'
    const e = r.end_d_minus != null ? `D-${r.end_d_minus}` : '0'
    return `${s} ~ ${e}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">취소료</h1>
          <p className="text-sm text-slate-400">전체 {data.length}건</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="행사명·구분 검색"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[900px] w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">구분</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">기준출발일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-28">D-day 범위</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">적용시작일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">적용종료일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">취소료(인당)</th>
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
                <td className="px-3 py-2 text-slate-600">{r.category ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                  {r.voyages ? formatDate(r.voyages.departure_date) : '—'}
                </td>
                <td className="px-3 py-2 font-mono text-slate-700">{dRange(r)}</td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                  {r.start_date ? formatDate(r.start_date) : '—'}
                </td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                  {r.end_date ? formatDate(r.end_date) : '—'}
                </td>
                <td className="px-3 py-2 font-medium text-slate-800">{feeText(r)}</td>
                <td className="px-3 py-2 text-slate-500">{r.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
