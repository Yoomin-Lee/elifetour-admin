import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Pencil, Trash2, Check, X, ExternalLink, Zap } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { useAuth } from '@/context/AuthContext'
import {
  fetchAllCancellationPolicies,
  saveCancellationPolicy,
  deleteCancellationPolicy,
  restoreCancellationPolicy,
} from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import { YearSelect } from '@/components/ui/year-select'
import type { CancellationPolicy } from '@/types/database'

const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY']

function calcDMinus(date?: string | null): number | null {
  if (!date) return null
  const dep = new Date(date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((dep.getTime() - today.getTime()) / 86400000)
}

function isCruiseCat(category: string | null): boolean {
  return (category ?? '').includes('크루즈')
}

function refDate(r: { reference_date?: string | null; category: string | null; voyages?: { departure_date?: string | null; boarding_date?: string | null } | null }): string | null {
  if (r.reference_date) return r.reference_date
  if (isCruiseCat(r.category) && r.voyages?.boarding_date) return r.voyages.boarding_date
  return r.voyages?.departure_date ?? null
}

function isActivePolicyRow(
  start_d_minus: number | null,
  end_d_minus: number | null,
  d: number | null,
): boolean {
  if (d === null || d < 0) return false
  const inStart = start_d_minus == null || d <= start_d_minus
  const inEnd   = end_d_minus   == null || d >= end_d_minus
  return inStart && inEnd
}

type CancelForm = {
  category: string
  start_d_minus: string
  end_d_minus: string
  reference_date: string
  fee_unit: string
  fee_description: string
  note: string
}

function toForm(r: CancellationPolicy): CancelForm {
  return {
    category:     r.category ?? '',
    start_d_minus: r.start_d_minus != null ? String(r.start_d_minus) : '',
    end_d_minus:   r.end_d_minus   != null ? String(r.end_d_minus)   : '',
    reference_date: r.reference_date ?? '',
    fee_unit:      r.fee_unit      ?? '',
    fee_description: r.fee_description ?? '',
    note:          r.note          ?? '',
  }
}

const EMPTY_FORM: CancelForm = {
  category: '', start_d_minus: '', end_d_minus: '',
  reference_date: '', fee_unit: '', fee_description: '', note: '',
}

export default function CancellationTab() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('ALL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CancelForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const qc = useQueryClient()
  const { canWrite } = useAuth() as { canWrite: boolean }

  const { data = [], isLoading } = useQuery({
    queryKey: ['all-cancellation'],
    queryFn: fetchAllCancellationPolicies,
  })

  const editMut = useMutation({
    mutationFn: (r: CancellationPolicy) => saveCancellationPolicy(
      r.voyage_id,
      {
        category:      editForm.category || null,
        start_d_minus: editForm.start_d_minus ? Number(editForm.start_d_minus) : null,
        end_d_minus:   editForm.end_d_minus   ? Number(editForm.end_d_minus)   : null,
        start_date:    r.start_date,
        end_date:      r.end_date,
        reference_date: editForm.reference_date || null,
        fee_description: editForm.fee_description || null,
        fee_type:      r.fee_type,
        fee_value:     r.fee_value,
        fee_unit:      editForm.fee_unit || null,
        note:          editForm.note || null,
        sort_order:    r.sort_order,
      },
      r.id,
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-cancellation'] })
      setEditingId(null)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteCancellationPolicy,
    onMutate: (id: string) => ({ snapshot: data.find(r => r.id === id) ?? null }),
    onSuccess: (_r, _id, ctx) => {
      qc.invalidateQueries({ queryKey: ['all-cancellation'] })
      setDeleteTarget(null)
      const snap = ctx?.snapshot
      toast.success('삭제되었습니다', snap ? {
        action: {
          label: '되돌리기',
          onClick: () => restoreCancellationPolicy(snap)
            .then(() => { qc.invalidateQueries({ queryKey: ['all-cancellation'] }); toast.success('복원됐습니다') })
            .catch(() => toast.error('복원에 실패했습니다')),
        },
      } : undefined)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  function startEdit(r: CancellationPolicy) {
    setEditForm(toForm(r))
    setEditingId(r.id)
    editMut.reset()
  }

  function setField(field: keyof CancelForm, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  function setCurrency(currency: string) {
    setEditForm(prev => {
      const desc = prev.fee_description
      const prefix = CURRENCIES.find(c => desc === c || desc.startsWith(c + ' '))
      const newDesc = !desc
        ? currency + ' '
        : prefix ? currency + desc.slice(prefix.length) : desc
      return { ...prev, fee_unit: currency, fee_description: newDesc }
    })
  }

  const years = useMemo(() => {
    const ys = new Set<string>()
    data.forEach(r => {
      const yr = r.voyages?.departure_date?.slice(0, 4)
      if (yr) ys.add(yr)
    })
    return Array.from(ys).sort().reverse()
  }, [data])

  const filtered = data.filter(r => {
    if (yearFilter !== 'ALL' && !r.voyages?.departure_date?.startsWith(yearFilter)) return false
    return !filter ||
      (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
      (r.category ?? '').includes(filter)
  })

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
    const e = r.end_d_minus   != null ? `D-${r.end_d_minus}`   : '0'
    return `${s} ~ ${e}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">취소료</h1>
          <p className="text-sm text-slate-400">전체 {data.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect value={yearFilter} years={years} onChange={setYearFilter} />
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
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[900px] w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">구분</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">기준일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-28">D-day 범위</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-14">현재</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">취소료(인당)</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16">통화</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">비고</th>
              <th className="px-3 py-2.5 w-14" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
            )}
            {filtered.map(r => {
              const isEdit = editingId === r.id
              const d = calcDMinus(refDate(r))
              const active = isActivePolicyRow(r.start_d_minus, r.end_d_minus, d)
              return (
                <>
                  <tr key={r.id} className={active ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50'}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.voyages ? (
                        <button
                          onClick={() => navigate(`/voyages?tab=항차검색&voyage=${r.voyage_id}`)}
                          className="group flex items-center gap-1 font-medium text-slate-800 hover:text-brand transition"
                          title="항차 상세에서 보기"
                        >
                          {voyageTitle(r.voyages)}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        </button>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{r.category ?? '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.voyages ? (
                        <span className="text-slate-600">
                          {formatDate(refDate(r) ?? r.voyages.departure_date)}
                          {r.reference_date ? (
                            <span className="ml-1 text-[10px] text-cyan-500 font-medium">(직접)</span>
                          ) : isCruiseCat(r.category) && r.voyages.boarding_date ? (
                            <span className="ml-1 text-[10px] text-slate-400">(승선)</span>
                          ) : (
                            <span className="ml-1 text-[10px] text-slate-400">(출발)</span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-700">{dRange(r)}</td>
                    <td className="px-3 py-2">
                      {active && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          <Zap className="h-2.5 w-2.5" />적용중
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">{feeText(r)}</td>
                    <td className="px-3 py-2 text-slate-500">{r.fee_unit ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{r.note ?? ''}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        {!isEdit && canWrite && (
                          <>
                            <button
                              onClick={() => startEdit(r)}
                              className="rounded p-1 text-slate-400 hover:text-brand hover:bg-slate-100 transition"
                              title="편집"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: r.id, label: r.category ?? '취소료' })}
                              className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                              title="삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isEdit && (
                    <tr key={`${r.id}-edit`}>
                      <td colSpan={9} className="px-4 py-3 bg-brand/5 border-t border-brand/10">
                        {editMut.isError && (
                          <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                          <div>
                            <label className="label">구분</label>
                            <Input value={editForm.category} onChange={e => setField('category', e.target.value)} placeholder="크루즈" className="h-7 text-sm" />
                          </div>
                          <div>
                            <label className="label">시작 D-</label>
                            <Input type="number" value={editForm.start_d_minus} onChange={e => setField('start_d_minus', e.target.value)} placeholder="90" className="h-7 text-sm" />
                          </div>
                          <div>
                            <label className="label">종료 D-</label>
                            <Input type="number" value={editForm.end_d_minus} onChange={e => setField('end_d_minus', e.target.value)} placeholder="45" className="h-7 text-sm" />
                          </div>
                          <div>
                            <label className="label">통화</label>
                            <FieldSelect
                              value={editForm.fee_unit}
                              options={CURRENCIES}
                              onChange={setCurrency}
                              className="h-7 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="label">취소료 설명</label>
                            <Input value={editForm.fee_description} onChange={e => setField('fee_description', e.target.value)} placeholder="크루즈 요금의 50%" className="h-7 text-sm" />
                          </div>
                          <div className="col-span-2">
                            <label className="label">기준일 직접 지정 <span className="text-slate-400 font-normal">(비워두면 자동)</span></label>
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={editForm.reference_date}
                                onChange={e => setField('reference_date', e.target.value)}
                                className="h-7 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand"
                              />
                              {editForm.reference_date && (
                                <button type="button" onClick={() => setField('reference_date', '')}
                                  className="shrink-0 text-xs text-slate-400 hover:text-red-500 px-1 transition">✕</button>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 sm:col-span-4 lg:col-span-6">
                            <label className="label">비고</label>
                            <Input value={editForm.note} onChange={e => setField('note', e.target.value)} placeholder="추가 메모" className="h-7 text-sm" />
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => editMut.mutate(r)}
                            disabled={editMut.isPending}
                            className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-40"
                          >
                            <Check className="h-3.5 w-3.5" />{editMut.isPending ? '저장 중…' : '저장'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={editMut.isPending}
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

      {deleteTarget && (
        <ConfirmDeleteModal
          message={`"${deleteTarget.label}" 취소료 항목을 삭제합니다.`}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          pending={deleteMut.isPending}
        />
      )}
    </div>
  )
}
