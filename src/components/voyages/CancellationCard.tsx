import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import { Button } from '@/components/ui/button'

const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY']
import { cn } from '@/lib/utils'
import { saveCancellationPolicy, deleteCancellationPolicy } from '@/lib/queries/voyages'
import type { CancellationPolicy } from '@/types/database'

function dMinus(date: string): number {
  const dep = new Date(date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((dep.getTime() - today.getTime()) / 86400000)
}

// 크루즈 카테고리 여부 (정확히 '크루즈' 또는 크루즈 포함 문자열)
function isCruiseCat(category: string | null): boolean {
  return (category ?? '').includes('크루즈')
}

function dMinusForPolicy(p: CancellationPolicy, departureDate: string, boardingDate: string | null): number {
  if (p.reference_date) return dMinus(p.reference_date)
  if (isCruiseCat(p.category) && boardingDate) return dMinus(boardingDate)
  return dMinus(departureDate)
}

function isCurrent(p: CancellationPolicy, d: number): boolean {
  const inStart = p.start_d_minus == null || d <= p.start_d_minus
  const inEnd   = p.end_d_minus   == null || d >= p.end_d_minus
  return inStart && inEnd
}

function dLabel(val: number | null): string {
  return val == null ? '~' : `D-${val}`
}

type DraftPolicy = {
  _key: string
  _isNew: boolean
  _deleted: boolean
  id: string
  category: string
  start_d_minus: string
  end_d_minus: string
  reference_date: string
  fee_description: string
  fee_unit: string
  note: string
  sort_order: number
}

function toDraft(p: CancellationPolicy): DraftPolicy {
  return {
    _key: p.id, _isNew: false, _deleted: false, id: p.id,
    category: p.category ?? '',
    start_d_minus: p.start_d_minus != null ? String(p.start_d_minus) : '',
    end_d_minus: p.end_d_minus != null ? String(p.end_d_minus) : '',
    reference_date: p.reference_date ?? '',
    fee_description: p.fee_description ?? '',
    fee_unit: p.fee_unit ?? '',
    note: p.note ?? '',
    sort_order: p.sort_order,
  }
}

const EMPTY: Omit<DraftPolicy, '_key'> = {
  _isNew: true, _deleted: false, id: '',
  category: '', start_d_minus: '', end_d_minus: '',
  reference_date: '', fee_description: '', fee_unit: '', note: '', sort_order: 0,
}

function toInput(r: DraftPolicy, idx: number) {
  return {
    category: r.category || null,
    start_d_minus: r.start_d_minus ? Number(r.start_d_minus) : null,
    end_d_minus: r.end_d_minus ? Number(r.end_d_minus) : null,
    start_date: null,
    end_date: null,
    reference_date: r.reference_date || null,
    fee_description: r.fee_description || null,
    fee_type: null,
    fee_value: null,
    fee_unit: r.fee_unit || null,
    note: r.note || null,
    sort_order: r.sort_order || idx + 1,
  }
}

export default function CancellationCard({
  policies,
  departureDate,
  boardingDate,
  voyageId,
  canWrite = true,
}: {
  policies: CancellationPolicy[]
  departureDate: string
  boardingDate?: string | null
  voyageId: string
  canWrite?: boolean
}) {
  const flightDDay  = dMinus(departureDate)
  const cruiseDDay  = boardingDate ? dMinus(boardingDate) : flightDDay
  void flightDDay  // 기존 호환성 유지용 (편집 모드)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DraftPolicy[]>([])
  const qc = useQueryClient()

  const saveMut = useMutation({
    mutationFn: async () => {
      let idx = 0
      await Promise.all(draft.map(r => {
        if (r._deleted && !r._isNew) return deleteCancellationPolicy(r.id)
        if (r._isNew && !r._deleted) return saveCancellationPolicy(voyageId, toInput(r, idx++))
        if (!r._isNew && !r._deleted) return saveCancellationPolicy(voyageId, toInput(r, idx++), r.id)
        return Promise.resolve()
      }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cancellation', voyageId] })
      setEditing(false)
      setDraft([])
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  function startEdit() {
    setDraft(policies.map(toDraft))
    setEditing(true)
  }

  function addRow() {
    setDraft(d => [...d, { ...EMPTY, _key: `new-${Date.now()}` }])
  }

  function removeRow(key: string) {
    setDraft(d =>
      d.map(r => r._key === key
        ? (r._isNew ? null : { ...r, _deleted: true })
        : r
      ).filter((r): r is DraftPolicy => r !== null)
    )
  }

  function upd(key: string, field: keyof DraftPolicy, value: string) {
    setDraft(d => d.map(r => r._key === key ? { ...r, [field]: value } : r))
  }

  function updCurrency(key: string, currency: string) {
    setDraft(d => d.map(r => {
      if (r._key !== key) return r
      const desc = r.fee_description
      const prefix = CURRENCIES.find(c => desc === c || desc.startsWith(c + ' '))
      const newDesc = !desc
        ? currency + ' '
        : prefix ? currency + desc.slice(prefix.length) : desc
      return { ...r, fee_unit: currency, fee_description: newDesc }
    }))
  }

  const visible = draft.filter(r => !r._deleted)

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>취소료</CardTitle>
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={saveMut.isPending}>
              <Plus className="h-3.5 w-3.5" /> 행 추가
            </Button>
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-50 transition disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />{saveMut.isPending ? '저장 중…' : '저장'}
            </button>
            <button
              onClick={() => { setEditing(false); setDraft([]) }}
              disabled={saveMut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-400 hover:bg-slate-100 transition"
            >
              <X className="h-3.5 w-3.5" />취소
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {saveMut.isError && (
            <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
          )}
          <div className="space-y-2">
            {visible.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">행 추가를 눌러 취소료를 등록하세요</p>
            ) : (
              visible.map((r, i) => (
                <div key={r._key} className="relative rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                  <button
                    type="button"
                    onClick={() => removeRow(r._key)}
                    className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <span className="mb-2 block text-xs font-medium text-slate-400">{i + 1}번</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div>
                      <label className="label">구분</label>
                      <Input value={r.category} onChange={e => upd(r._key, 'category', e.target.value)} placeholder="크루즈" className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">시작 D-</label>
                      <Input type="number" value={r.start_d_minus} onChange={e => upd(r._key, 'start_d_minus', e.target.value)} placeholder="90" className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">종료 D-</label>
                      <Input type="number" value={r.end_d_minus} onChange={e => upd(r._key, 'end_d_minus', e.target.value)} placeholder="45" className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">통화</label>
                      <FieldSelect
                        value={r.fee_unit}
                        options={CURRENCIES}
                        onChange={v => updCurrency(r._key, v)}
                        className="h-7 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="label">기준일 직접 지정 <span className="text-slate-400 font-normal">(항공·크루즈 각각 다를 때)</span></label>
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={r.reference_date}
                          onChange={e => upd(r._key, 'reference_date', e.target.value)}
                          className="h-7 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                        {r.reference_date && (
                          <button type="button" onClick={() => upd(r._key, 'reference_date', '')}
                            className="shrink-0 text-xs text-slate-400 hover:text-red-500 px-1 transition">✕</button>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-4">
                      <label className="label">취소료 설명</label>
                      <Input value={r.fee_description} onChange={e => upd(r._key, 'fee_description', e.target.value)} placeholder="크루즈 요금의 50%" className="h-7 text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-4">
                      <label className="label">비고</label>
                      <Input value={r.note} onChange={e => upd(r._key, 'note', e.target.value)} placeholder="추가 메모" className="h-7 text-sm" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>취소료</CardTitle>
        <div className="flex items-center gap-2">
          {boardingDate && boardingDate !== departureDate ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>항공 D-{flightDDay > 0 ? flightDDay : 0}</span>
              <span className="text-slate-200">|</span>
              <span>크루즈 D-{cruiseDDay > 0 ? cruiseDDay : 0}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">D-{flightDDay > 0 ? flightDDay : 0} 기준</span>
          )}
          {canWrite && (
            <button
              onClick={startEdit}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="편집"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {policies.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">등록된 취소료가 없습니다</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>구분</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>취소료</TableHead>
                <TableHead>통화</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map(p => {
                const d = dMinusForPolicy(p, departureDate, boardingDate ?? null)
                const current = isCurrent(p, d)
                return (
                  <TableRow
                    key={p.id}
                    className={cn(current && 'bg-amber-50 font-semibold')}
                  >
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        {current && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        )}
                        {p.category ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500">
                      {dLabel(p.start_d_minus)} ~ {dLabel(p.end_d_minus)}
                    </TableCell>
                    <TableCell className={cn(current && 'text-amber-700')}>
                      {p.fee_description ?? '-'}
                    </TableCell>
                    <TableCell className="text-slate-500">{p.fee_unit ?? '-'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
