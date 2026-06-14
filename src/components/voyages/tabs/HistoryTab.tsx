import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { fetchAllHistoryLogs } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yy}/${mm}/${dd} ${hh}:${min}`
}

export default function HistoryTab() {
  const [filter, setFilter] = useState('')
  const { data = [], isLoading } = useQuery({
    queryKey: ['all-history'],
    queryFn: fetchAllHistoryLogs,
  })

  const filtered = data.filter(r =>
    !filter ||
    (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
    (r.author ?? '').includes(filter) ||
    r.content.includes(filter)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">히스토리</h1>
          <p className="text-sm text-slate-400">전체 {data.length}건</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="행사명·작성자·내용 검색"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[700px] w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-32">일시</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">작성자</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">내용</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                  {r.voyages ? voyageTitle(r.voyages) : '—'}
                </td>
                <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap">
                  {formatDateTime(r.logged_at)}
                </td>
                <td className="px-3 py-2 text-slate-600">{r.author ?? '—'}</td>
                <td className="px-3 py-2 text-slate-700 leading-relaxed">{r.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
