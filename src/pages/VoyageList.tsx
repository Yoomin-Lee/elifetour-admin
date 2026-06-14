import { useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Copy, Search as SearchIcon } from 'lucide-react'
import { fetchVoyages, duplicateVoyage } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { VoyageStatus } from '@/types/database'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

export default function VoyageList() {
  return (
    <QueryClientProvider client={queryClient}>
      <VoyageListInner />
    </QueryClientProvider>
  )
}

const STATUS_VARIANT: Record<VoyageStatus, 'default' | 'success' | 'destructive' | 'warning' | 'info' | 'outline'> = {
  '미오픈':    'default',
  '판매중':    'success',
  '마감':      'warning',
  '출발완료':  'info',
  '취소':      'destructive',
}

const ALL_STATUSES: VoyageStatus[] = ['미오픈', '판매중', '마감', '출발완료', '취소']

function VoyageListInner() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<VoyageStatus | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const { data: voyages = [], isLoading } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const dupMutation = useMutation({
    mutationFn: (id: string) => duplicateVoyage(id),
    onMutate: (id) => setDuplicatingId(id),
    onSuccess: (newVoyage) => {
      setDuplicatingId(null)
      qc.invalidateQueries({ queryKey: ['voyages'] })
      navigate(`/voyages/search?voyage=${newVoyage.id}`)
    },
    onError: () => setDuplicatingId(null),
  })

  const filtered = statusFilter
    ? voyages.filter(v => v.status === statusFilter)
    : voyages

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">행사 목록</h1>
          <p className="text-sm text-slate-400">전체 {voyages.length}건</p>
        </div>
        <Button onClick={() => navigate('/voyages/new')}>
          <Plus className="h-4 w-4" /> 새 행사 등록
        </Button>
      </div>

      {/* 상태 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            !statusFilter ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          전체
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              statusFilter === s ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {statusFilter ? `'${statusFilter}' 상태인 행사가 없습니다` : '등록된 행사가 없습니다'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">행사명</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">상태</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-500 sm:table-cell">출발일</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-500 md:table-cell">귀국일</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-500 lg:table-cell">선사</th>
                <th className="hidden px-4 py-3 text-right text-xs font-semibold text-slate-500 sm:table-cell">잔여 캐빈</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{voyageTitle(v)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[v.status]}>{v.status}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{formatDate(v.departure_date)}</td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{formatDate(v.return_date)}</td>
                  <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{v.cruise_line ?? '-'}</td>
                  <td className="hidden px-4 py-3 text-right sm:table-cell">
                    <span className={v.cabin_remaining === 0 ? 'text-red-500 font-semibold' : 'text-slate-700'}>
                      {v.cabin_remaining}
                    </span>
                    <span className="text-slate-400"> / {v.cabin_total}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => navigate(`/voyages/search?voyage=${v.id}`)}
                        title="조회"
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand transition"
                      >
                        <SearchIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => dupMutation.mutate(v.id)}
                        disabled={duplicatingId === v.id}
                        title="복제"
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-40"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
