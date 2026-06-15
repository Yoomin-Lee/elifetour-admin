import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Pencil, Check, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { fetchVoyages, updateVoyage } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import type { Voyage } from '@/types/database'

type EditForm = {
  cruise_line: string
  ship_name: string
  cabin_total: string
  cabin_remaining: string
}

function toForm(v: Voyage): EditForm {
  return {
    cruise_line: v.cruise_line ?? '',
    ship_name: v.ship_name ?? '',
    cabin_total: String(v.cabin_total ?? ''),
    cabin_remaining: String(v.cabin_remaining ?? ''),
  }
}

export default function CruiseTab() {
  const [filter, setFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ cruise_line: '', ship_name: '', cabin_total: '', cabin_remaining: '' })
  const qc = useQueryClient()
  const { canWrite } = useAuth() as { canWrite: boolean }

  const { data: voyages = [], isLoading } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const saveMut = useMutation({
    mutationFn: (id: string) => updateVoyage(id, {
      cruise_line: editForm.cruise_line || null,
      ship_name: editForm.ship_name || null,
      cabin_total: Number(editForm.cabin_total) || 0,
      cabin_remaining: Number(editForm.cabin_remaining) || 0,
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
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setEditForm(prev => ({ ...prev, [field]: e.target.value }))
  }

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
          <p className="text-sm text-slate-400">캐빈 현황 · ✏️ 클릭으로 편집</p>
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
              <th className="px-3 py-2.5 w-14" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
            )}
            {!isLoading && ordered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
            )}
            {ordered.map(v => {
              const reserved = v.cabin_total - v.cabin_remaining
              const isCancelled = v.status === '취소'
              const isEdit = editingId === v.id
              return (
                <>
                  <tr
                    key={v.id}
                    className={['hover:bg-slate-50 transition-colors', isCancelled ? 'opacity-50' : ''].join(' ')}
                  >
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
                    <td className="px-3 py-2 text-right">
                      {!isEdit && canWrite && (
                        <button
                          onClick={() => startEdit(v)}
                          className="rounded p-1 text-slate-400 hover:text-brand hover:bg-slate-100 transition"
                          title="편집"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>

                  {isEdit && (
                    <tr key={`${v.id}-edit`}>
                      <td colSpan={9} className="px-3 py-3 bg-brand/5 border-t border-brand/10">
                        {saveMut.isError && (
                          <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-2">
                          <div>
                            <label className="label">선사</label>
                            <Input value={editForm.cruise_line} onChange={set('cruise_line')} placeholder="MSC" className="h-7 text-sm" />
                          </div>
                          <div>
                            <label className="label">크루즈 선박명</label>
                            <Input value={editForm.ship_name} onChange={set('ship_name')} placeholder="WORLD EUROPA" className="h-7 text-sm" />
                          </div>
                          <div>
                            <label className="label">보유 캐빈</label>
                            <Input type="number" min={0} value={editForm.cabin_total} onChange={set('cabin_total')} className="h-7 text-sm" />
                          </div>
                          <div>
                            <label className="label">잔여 캐빈</label>
                            <Input type="number" min={0} value={editForm.cabin_remaining} onChange={set('cabin_remaining')} className="h-7 text-sm" />
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
