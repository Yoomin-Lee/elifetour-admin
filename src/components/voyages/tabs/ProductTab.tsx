import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Eye, Copy, Pencil, Check, X } from 'lucide-react'
import { fetchVoyages, duplicateVoyage, updateVoyage } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import type { Voyage, VoyageStatus } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const STATUS_COLORS: Record<string, string> = {
  '미오픈':   'bg-slate-100 text-slate-600',
  '판매중':   'bg-blue-100 text-blue-700',
  '마감':     'bg-amber-100 text-amber-700',
  '출발완료': 'bg-green-100 text-green-700',
  '취소':     'bg-red-100 text-red-500',
}

const STATUSES: VoyageStatus[] = ['미오픈', '판매중', '마감', '출발완료', '취소']

function calcDDay(departure: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dep = new Date(departure); dep.setHours(0, 0, 0, 0)
  const diff = Math.round((dep.getTime() - today.getTime()) / 86_400_000)
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return 'D-day'
  return `D+${Math.abs(diff)}`
}

type EditForm = {
  status: VoyageStatus
  customer_count: string
  tour_leader: string
}

function toForm(v: Voyage): EditForm {
  return {
    status: v.status,
    customer_count: String(v.customer_count ?? ''),
    tour_leader: v.tour_leader ?? '',
  }
}

export default function ProductTab() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ status: '미오픈', customer_count: '', tour_leader: '' })

  const { data: voyages = [], isLoading } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const dupMut = useMutation({
    mutationFn: duplicateVoyage,
    onSuccess: (newVoyage) => {
      qc.invalidateQueries({ queryKey: ['voyages'] })
      setDuplicatingId(null)
      navigate(`/voyages?tab=항차검색&voyage=${newVoyage.id}`)
    },
    onError: () => setDuplicatingId(null),
  })

  const saveMut = useMutation({
    mutationFn: (id: string) => updateVoyage(id, {
      status: editForm.status,
      customer_count: Number(editForm.customer_count) || 0,
      tour_leader: editForm.tour_leader || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voyages'] })
      setEditingId(null)
    },
  })

  function startEdit(v: Voyage) {
    setEditForm(toForm(v))
    setEditingId(v.id)
    saveMut.reset()
  }

  function set(field: keyof EditForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setEditForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const filtered = voyages.filter(v =>
    !filter || voyageTitle(v).toLowerCase().includes(filter.toLowerCase()) ||
    (v.region ?? '').includes(filter) ||
    (v.cruise_line ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    (v.tour_leader ?? '').includes(filter)
  )

  const active = filtered.filter(v => v.status !== '취소')
  const cancelled = filtered.filter(v => v.status === '취소')
  const ordered = [...active, ...cancelled]

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">상품 등록</h1>
          <p className="text-sm text-slate-400">전체 {voyages.length}건 · 취소 제외 {active.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="행사명·선사·인솔자 검색"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <Button size="sm" onClick={() => navigate('/voyages/new')}>
            <Plus className="h-4 w-4" /> 새 행사 등록
          </Button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[1100px] w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">출발일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">귀국일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">선사</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-28">크루즈</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16">항공</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-18">상태</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-14">고객</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">인솔자</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-16">D-DAY</th>
              <th className="px-3 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td>
              </tr>
            )}
            {!isLoading && ordered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-slate-400">등록된 행사가 없습니다</td>
              </tr>
            )}
            {ordered.map(v => {
              const isCancelled = v.status === '취소'
              const isEdit = editingId === v.id
              return (
                <>
                  <tr
                    key={v.id}
                    className={[
                      'hover:bg-slate-50 transition-colors',
                      isCancelled ? 'opacity-50' : '',
                    ].join(' ')}
                  >
                    <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                      {isCancelled ? (
                        <span className="line-through text-slate-400">{voyageTitle(v)}</span>
                      ) : voyageTitle(v)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(v.departure_date)}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{v.return_date ? formatDate(v.return_date) : '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{v.cruise_line ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{v.ship_name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{v.airline ?? '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[v.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700 font-medium">{v.customer_count}</td>
                    <td className="px-3 py-2 text-slate-600">{v.tour_leader ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={[
                        'font-mono text-[11px]',
                        isCancelled ? 'text-slate-400' : 'text-slate-700',
                      ].join(' ')}>
                        {calcDDay(v.departure_date)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        {!isEdit && (
                          <>
                            <button
                              title="편집"
                              onClick={() => startEdit(v)}
                              className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-100 transition"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="항차 조회"
                              onClick={() => navigate(`/voyages?tab=항차검색&voyage=${v.id}`)}
                              className="p-1 rounded text-slate-400 hover:text-brand transition"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="복제"
                              onClick={() => { setDuplicatingId(v.id); dupMut.mutate(v.id) }}
                              disabled={duplicatingId !== null}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 transition disabled:opacity-40"
                            >
                              {duplicatingId === v.id
                                ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                                : <Copy className="h-3.5 w-3.5" />
                              }
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isEdit && (
                    <tr key={`${v.id}-edit`}>
                      <td colSpan={11} className="px-3 py-3 bg-brand/5 border-t border-brand/10">
                        {saveMut.isError && (
                          <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-2">
                          <div>
                            <label className="label">상태</label>
                            <Select value={editForm.status} onChange={set('status')} className="h-7 py-0 text-sm">
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                          </div>
                          <div>
                            <label className="label">고객 수</label>
                            <Input
                              type="number"
                              min={0}
                              value={editForm.customer_count}
                              onChange={set('customer_count')}
                              className="h-7 text-sm"
                            />
                          </div>
                          <div>
                            <label className="label">인솔자</label>
                            <Input
                              value={editForm.tour_leader}
                              onChange={set('tour_leader')}
                              placeholder="미정"
                              className="h-7 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveMut.mutate(v.id)}
                            disabled={saveMut.isPending}
                            className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-40"
                          >
                            <Check className="h-3.5 w-3.5" />{saveMut.isPending ? '저장 중…' : '저장'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={saveMut.isPending}
                            className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-400 hover:bg-slate-100 transition"
                          >
                            <X className="h-3.5 w-3.5" />취소
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
