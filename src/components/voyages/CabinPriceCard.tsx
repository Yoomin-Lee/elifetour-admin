import { useState, Fragment } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import { SelectOrInput } from '@/components/ui/select-or-input'
import { saveCabinGrades } from '@/lib/queries/voyages'
import type { CabinGrade } from '@/types/database'

const CABIN_GRADES = ['4D', '2D', 'BA2', 'BR1', '3D(FIT)', '4U', 'BM1', 'VD', '1D', '3D', 'VC', 'VE']
const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY']
const AGENTS = ['TMK', 'COSTA', 'ONLINE', 'DONGBO', 'VASCO', 'FLORENCE']
const SYM: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥' }
const PRICE_FIELDS = ['ccf', 'nccf', 'tax', 'tip'] as const

function formatPrice(ccf: unknown, nccf: unknown, tax: unknown, tip: unknown, currency: string): string {
  const sum = (Number(ccf) || 0) + (Number(nccf) || 0) + (Number(tax) || 0) + (Number(tip) || 0)
  if (!sum) return '—'
  const prefix = SYM[currency] ?? (currency + ' ')
  return prefix + sum.toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
}

type DraftGrade = {
  _key: string
  id: string
  grade: string
  agent: string
  total: string
  reserved: string
  ccf: string
  nccf: string
  tax: string
  tip: string
  currency: string
  sort_order: number
}

function toDraft(g: CabinGrade): DraftGrade {
  return {
    _key: g.id,
    id: g.id,
    grade: g.grade,
    agent: g.agent ?? '',
    total: String(g.total ?? 0),
    reserved: String(g.reserved ?? 0),
    ccf: g.ccf != null ? String(g.ccf) : '',
    nccf: g.nccf != null ? String(g.nccf) : '',
    tax: g.tax != null ? String(g.tax) : '',
    tip: g.tip != null ? String(g.tip) : '',
    currency: g.currency ?? 'USD',
    sort_order: g.sort_order,
  }
}

let _keySeq = 1
function newKey() { return `new-${_keySeq++}` }

export default function CabinPriceCard({
  grades,
  voyageId,
  canWrite = true,
}: {
  grades: CabinGrade[]
  voyageId: string
  canWrite?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [drafts, setDrafts] = useState<DraftGrade[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const qc = useQueryClient()

  function startEdit() {
    setDrafts(grades.map(toDraft))
    setDeletedIds([])
    setEditing(true)
  }

  function upd(key: string, field: keyof DraftGrade, value: string) {
    setDrafts(prev => prev.map(d => d._key === key ? { ...d, [field]: value } : d))
  }

  function addGrade() {
    setDrafts(prev => [...prev, {
      _key: newKey(), id: '', grade: '', agent: '',
      total: '0', reserved: '0', ccf: '', nccf: '', tax: '', tip: '',
      currency: 'USD', sort_order: prev.length,
    }])
  }

  function removeGrade(key: string) {
    const found = drafts.find(d => d._key === key)
    if (found?.id) setDeletedIds(prev => [...prev, found.id])
    setDrafts(prev => prev.filter(d => d._key !== key))
  }

  const mut = useMutation({
    mutationFn: () => saveCabinGrades(
      voyageId,
      drafts.map((d, i) => ({
        id: d.id || undefined,
        grade: d.grade,
        agent: d.agent || null,
        total: Number(d.total) || 0,
        reserved: Number(d.reserved) || 0,
        price_per_person: null,
        ccf: d.ccf ? Number(d.ccf) : null,
        nccf: d.nccf ? Number(d.nccf) : null,
        tax: d.tax ? Number(d.tax) : null,
        tip: d.tip ? Number(d.tip) : null,
        currency: d.currency,
        sort_order: i,
      })),
      deletedIds,
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabin-grades', voyageId] })
      qc.invalidateQueries({ queryKey: ['voyages'] })
      setEditing(false)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  // ── 편집 모드 ────────────────────────────────────────────────────────────

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>캐빈가</CardTitle>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-50 transition disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />{mut.isPending ? '저장 중…' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={mut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-400 hover:bg-slate-100 transition"
            >
              <X className="h-3.5 w-3.5" />취소
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {drafts.map(d => {
            const remaining = (Number(d.total) || 0) - (Number(d.reserved) || 0)
            return (
              <div key={d._key} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                {/* 1행: 캐빈등급 / 에이전트 / 보유 / 예약 / 잔여 */}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[88px] flex-1">
                    <p className="text-[10px] text-slate-400 mb-0.5">캐빈 등급</p>
                    <SelectOrInput
                      value={d.grade} options={CABIN_GRADES}
                      onChange={v => upd(d._key, 'grade', v)} placeholder="등급 선택"
                    />
                  </div>
                  <div className="min-w-[88px] flex-1">
                    <p className="text-[10px] text-slate-400 mb-0.5">에이전트</p>
                    <SelectOrInput
                      value={d.agent} options={AGENTS}
                      onChange={v => upd(d._key, 'agent', v)} placeholder="에이전트"
                    />
                  </div>
                  <div className="w-14">
                    <p className="text-[10px] text-slate-400 mb-0.5">보유</p>
                    <Input type="number" min={0} value={d.total}
                      onChange={e => upd(d._key, 'total', e.target.value)}
                      placeholder="0" className="h-7 text-sm text-right" />
                  </div>
                  <div className="w-14">
                    <p className="text-[10px] text-slate-400 mb-0.5">예약</p>
                    <Input type="number" min={0} value={d.reserved}
                      onChange={e => upd(d._key, 'reserved', e.target.value)}
                      placeholder="0" className="h-7 text-sm text-right" />
                  </div>
                  <div className="w-14">
                    <p className="text-[10px] text-slate-400 mb-0.5">잔여</p>
                    <div className={`h-7 flex items-center justify-end pr-2 text-sm font-medium rounded-lg border border-slate-200 bg-white ${remaining < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                      {remaining}
                    </div>
                  </div>
                  <button type="button" onClick={() => removeGrade(d._key)}
                    className="self-end p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {/* 2행: CCF + NCCF + TAX + TIP = 캐빈가 / 통화 */}
                <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-slate-200">
                  {PRICE_FIELDS.map((f, i) => (
                    <Fragment key={f}>
                      <div className="w-16">
                        <p className="text-[10px] text-slate-400 mb-0.5">{f.toUpperCase()}</p>
                        <Input type="number" min={0} step="0.01"
                          value={d[f]}
                          onChange={e => upd(d._key, f, e.target.value)}
                          placeholder="—" className="h-7 text-sm text-right" />
                      </div>
                      {i < 3 && <span className="text-slate-400 pb-1 text-sm">+</span>}
                    </Fragment>
                  ))}
                  <span className="text-slate-400 pb-1 text-sm">=</span>
                  <div className="w-24">
                    <p className="text-[10px] text-brand mb-0.5">캐빈가</p>
                    <div className="h-7 flex items-center justify-end pr-3 text-sm font-semibold text-brand border border-slate-200 rounded-lg bg-white">
                      {formatPrice(d.ccf, d.nccf, d.tax, d.tip, d.currency)}
                    </div>
                  </div>
                  <div className="w-20">
                    <p className="text-[10px] text-slate-400 mb-0.5">통화</p>
                    <FieldSelect value={d.currency} options={CURRENCIES}
                      onChange={v => upd(d._key, 'currency', v)} className="h-7 text-sm" />
                  </div>
                </div>
              </div>
            )
          })}
          <button type="button" onClick={addGrade}
            className="flex items-center gap-1 text-xs text-brand font-medium hover:underline transition">
            <Plus className="h-3.5 w-3.5" />등급 추가
          </button>
        </CardContent>
      </Card>
    )
  }

  // ── 보기 모드 ────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader>
        <CardTitle>캐빈가</CardTitle>
        {canWrite && (
          <button
            onClick={startEdit}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="편집"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </CardHeader>
      <CardContent>
        {grades.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">등록된 캐빈 등급이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {grades.map(g => {
              const remaining = (g.total ?? 0) - (g.reserved ?? 0)
              return (
                <div key={g.id} className="rounded-lg border border-slate-100 p-3 space-y-1.5">
                  {/* 등급명 / 에이전트 / 보유·예약·잔여 */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-slate-800">{g.grade || '—'}</span>
                    {g.agent && <span className="text-xs text-slate-400">{g.agent}</span>}
                    <div className="flex items-center gap-3 ml-auto text-sm">
                      <span className="text-slate-400">보유 <span className="font-medium text-slate-700">{g.total ?? 0}</span></span>
                      <span className="text-slate-400">예약 <span className="font-medium text-slate-700">{g.reserved ?? 0}</span></span>
                      <span className="text-slate-400">잔여 <span className={`font-medium ${remaining < 0 ? 'text-red-500' : 'text-slate-700'}`}>{remaining}</span></span>
                    </div>
                  </div>
                  {/* 가격 계산식 */}
                  <div className="flex flex-wrap items-center gap-1 text-sm">
                    {PRICE_FIELDS.map((f, i) => (
                      <Fragment key={f}>
                        <span className="text-slate-400">{f.toUpperCase()}</span>
                        <span className="font-mono text-slate-600">{g[f] != null ? g[f] : '—'}</span>
                        {i < 3 && <span className="text-slate-300 mx-0.5">+</span>}
                      </Fragment>
                    ))}
                    <span className="text-slate-300 mx-1">=</span>
                    <span className="font-semibold text-brand">
                      {formatPrice(g.ccf, g.nccf, g.tax, g.tip, g.currency)}
                    </span>
                    <span className="text-slate-400 ml-0.5">{g.currency}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
