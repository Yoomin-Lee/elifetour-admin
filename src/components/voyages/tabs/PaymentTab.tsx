import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Save, Trash2, ExternalLink, Plus } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { fetchVoyages } from '@/lib/queries/voyages'
import {
  fetchPaymentSchedules,
  fetchPaymentSchedulesByMonth,
  upsertPaymentSchedule,
  deletePaymentSchedule,
  restorePaymentSchedule,
  togglePaymentCompleted,
} from '@/lib/queries/paymentSchedules'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { YearSelect } from '@/components/ui/year-select'
import { FieldSelect } from '@/components/ui/field-select'
import { voyageTitle } from '@/types/database'
import type { PaymentCategory, PaymentSchedule } from '@/types/database'

const CATEGORIES: PaymentCategory[] = ['CRUISE', 'FLIGHT', 'HOTEL', 'LAND', 'INSURANCE']
const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY'] as const

const CATEGORY_LABEL: Record<PaymentCategory, string> = {
  CRUISE: '크루즈', FLIGHT: '항공', HOTEL: '호텔', LAND: '랜드', INSURANCE: '보험',
}

function paymentTypeLabel(pt: string): string {
  if (pt === 'TOTAL') return '총 금액'
  if (pt === 'DEPOSIT_1ST') return '1차 데포짓'
  if (pt === 'DEPOSIT_2ND') return '2차 데포짓'
  if (pt === 'BALANCE') return '잔금'
  const m = pt.match(/^DEPOSIT_(\d+)$/)
  if (m) return `${m[1]}차 데포짓`
  return pt
}
const CATEGORY_STYLE: Record<PaymentCategory, { header: string; card: string }> = {
  CRUISE: {
    header: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    card:   'border-cyan-200 bg-cyan-50/60 text-cyan-900',
  },
  FLIGHT: {
    header: 'text-amber-700 bg-amber-50 border-amber-200',
    card:   'border-amber-200 bg-amber-50/60 text-amber-900',
  },
  HOTEL: {
    header: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    card:   'border-emerald-200 bg-emerald-50/60 text-emerald-900',
  },
  LAND: {
    header: 'text-violet-700 bg-violet-50 border-violet-200',
    card:   'border-violet-200 bg-violet-50/60 text-violet-900',
  },
  INSURANCE: {
    header: 'text-rose-700 bg-rose-50 border-rose-200',
    card:   'border-rose-200 bg-rose-50/60 text-rose-900',
  },
}

type DraftCell = {
  id?: string
  amount: string
  currency: string
  due_date: string
  is_completed: boolean
  memo: string
}
type DraftKey = string  // `${section}_${category}_${payment_type}`

function makeDraftKey(section: string, category: PaymentCategory, pt: string): DraftKey {
  return `${section}_${category}_${pt}`
}

function getPaymentTypes(extra: number): string[] {
  const rows: string[] = ['DEPOSIT_1ST', 'DEPOSIT_2ND']
  for (let i = 3; i <= 2 + extra; i++) rows.push(`DEPOSIT_${i}`)
  rows.push('BALANCE')
  return rows
}

function emptyCell(): DraftCell {
  return { amount: '', currency: 'KRW', due_date: '', is_completed: false, memo: '' }
}

function fromSchedule(s: PaymentSchedule): DraftCell {
  return {
    id: s.id,
    amount: s.amount > 0 ? String(s.amount) : '',
    currency: s.currency,
    due_date: s.due_date ?? '',
    is_completed: s.is_completed,
    memo: s.memo ?? '',
  }
}

function formatAmount(amount: string, currency: string): string {
  const n = Number(amount)
  if (!n) return '—'
  const sym: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥' }
  const prefix = sym[currency] ?? (currency + ' ')
  return prefix + n.toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
}

export default function PaymentTab() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlVoyageId = searchParams.get('voyage') ?? ''
  const urlFilter = searchParams.get('filter')  // 'this-month' | null
  const [voyageId, setVoyageId] = useState(urlVoyageId)
  const [yearFilter, setYearFilter] = useState<string>('ALL')
  const [thisMonthMode, setThisMonthMode] = useState(urlFilter === 'this-month')
  const now = new Date()
  const didAutoSelectRef = useRef(false)

  // URL voyage 파라미터가 바뀌면 선택 행사 동기화
  useEffect(() => {
    if (urlVoyageId) setVoyageId(urlVoyageId)
  }, [urlVoyageId])
  const [editing, setEditing] = useState<DraftKey | null>(null)
  const [drafts, setDrafts] = useState<Record<DraftKey, DraftCell>>({})
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [extraCounts, setExtraCounts] = useState({ PAYMENT: 0 })
  const [refundCardCounts, setRefundCardCounts] = useState<Record<PaymentCategory, number>>({ CRUISE: 0, FLIGHT: 0, HOTEL: 0, LAND: 0, INSURANCE: 0 })
  const qc = useQueryClient()

  const { data: voyages = [] } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const years = useMemo(() => {
    const ys = new Set<string>()
    voyages.forEach(v => { if (v.departure_date) ys.add(v.departure_date.slice(0, 4)) })
    return Array.from(ys).sort().reverse()
  }, [voyages])

  // 이번달 결제 마감 필터용 쿼리
  const { data: thisMonthSchedules = [] } = useQuery({
    queryKey: ['payment-schedules-month', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => fetchPaymentSchedulesByMonth(now.getFullYear(), now.getMonth() + 1),
    enabled: thisMonthMode,
  })

  const thisMonthVoyageIds = useMemo(() => {
    if (!thisMonthMode) return null
    return new Set(thisMonthSchedules.map(s => s.voyage_id))
  }, [thisMonthMode, thisMonthSchedules])

  const filteredVoyages = useMemo(() => {
    const sorted = [...voyages]
      .sort((a, b) => (b.departure_date ?? '').localeCompare(a.departure_date ?? ''))
    if (thisMonthVoyageIds) return sorted.filter(v => thisMonthVoyageIds.has(v.id))
    if (yearFilter === 'ALL') return sorted
    return sorted.filter(v => v.departure_date?.startsWith(yearFilter))
  }, [voyages, yearFilter, thisMonthVoyageIds])

  // 이번달 모드 진입 시 첫 번째 행사 자동 선택
  useEffect(() => {
    if (thisMonthMode && !voyageId && filteredVoyages.length > 0 && !didAutoSelectRef.current) {
      didAutoSelectRef.current = true
      setVoyageId(filteredVoyages[0].id)
    }
  }, [thisMonthMode, filteredVoyages, voyageId])

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['payment-schedules', voyageId],
    queryFn: () => fetchPaymentSchedules(voyageId),
    enabled: !!voyageId,
  })

  useEffect(() => {
    if (!voyageId) return

    const depositNums = schedules
      .filter(s => (s.section ?? 'PAYMENT') === 'PAYMENT')
      .map(s => s.payment_type)
      .filter(pt => /^DEPOSIT_(\d+)$/.test(pt))
      .map(pt => parseInt(pt.replace('DEPOSIT_', ''), 10))
    const paymentExtra = depositNums.length > 0 ? Math.max(0, Math.max(...depositNums) - 2) : 0
    setExtraCounts({ PAYMENT: paymentExtra })

    const newRefundCounts: Record<PaymentCategory, number> = { CRUISE: 0, FLIGHT: 0, HOTEL: 0, LAND: 0, INSURANCE: 0 }
    for (const c of CATEGORIES) {
      const nums = schedules
        .filter(s => (s.section ?? 'PAYMENT') === 'REFUND' && s.category === c)
        .map(s => s.payment_type)
        .filter(pt => /^REFUND_(\d+)$/.test(pt))
        .map(pt => parseInt(pt.replace('REFUND_', ''), 10))
      newRefundCounts[c] = nums.length > 0 ? Math.max(...nums) : 0
    }
    setRefundCardCounts(newRefundCounts)

    const next: Record<DraftKey, DraftCell> = {}

    // 총 금액 행
    for (const c of CATEGORIES) {
      const key = makeDraftKey('PAYMENT', c, 'TOTAL')
      const existing = schedules.find(s =>
        s.category === c && s.payment_type === 'TOTAL' && (s.section ?? 'PAYMENT') === 'PAYMENT'
      )
      next[key] = existing ? fromSchedule(existing) : emptyCell()
    }

    // 결제 섹션: 카테고리 × 결제유형 그리드
    const paymentTypes = getPaymentTypes(paymentExtra)
    for (const c of CATEGORIES) {
      for (const pt of paymentTypes) {
        const key = makeDraftKey('PAYMENT', c, pt)
        const existing = schedules.find(s =>
          s.category === c && s.payment_type === pt && (s.section ?? 'PAYMENT') === 'PAYMENT'
        )
        next[key] = existing ? fromSchedule(existing) : emptyCell()
      }
    }

    // 환불 섹션: 카테고리별 REFUND_1, REFUND_2, ... 카드
    for (const c of CATEGORIES) {
      for (let i = 1; i <= newRefundCounts[c]; i++) {
        const pt = `REFUND_${i}`
        const key = makeDraftKey('REFUND', c, pt)
        const existing = schedules.find(s =>
          s.category === c && s.payment_type === pt && (s.section ?? 'PAYMENT') === 'REFUND'
        )
        next[key] = existing ? fromSchedule(existing) : emptyCell()
      }
    }

    setDrafts(next)
    setEditing(null)
  }, [schedules, voyageId])

  const upsertMut = useMutation({
    mutationFn: ({ key, cell }: { key: DraftKey; cell: DraftCell }) => {
      const [secPart, catPart, ...rest] = key.split('_')
      const pt = rest.join('_')
      return upsertPaymentSchedule({
        voyage_id: voyageId,
        category: catPart as PaymentCategory,
        payment_type: pt,
        section: secPart,
        amount: Number(cell.amount) || 0,
        currency: cell.currency,
        due_date: pt === 'TOTAL' ? null : (cell.due_date || null),
        is_completed: cell.is_completed,
        memo: cell.memo || null,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-schedules', voyageId] })
      qc.invalidateQueries({ queryKey: ['all-payment-schedules'] })
      setEditing(null)
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePaymentSchedule(id),
    onMutate: (id: string) => ({ snapshot: schedules.find(s => s.id === id) ?? null }),
    onSuccess: (_r, _id, ctx) => {
      qc.invalidateQueries({ queryKey: ['payment-schedules', voyageId] })
      qc.invalidateQueries({ queryKey: ['all-payment-schedules'] })
      setDeleteTarget(null)
      const snap = ctx?.snapshot
      toast.success('삭제되었습니다', snap ? {
        action: {
          label: '되돌리기',
          onClick: () => restorePaymentSchedule(snap)
            .then(() => {
              qc.invalidateQueries({ queryKey: ['payment-schedules', voyageId] })
              qc.invalidateQueries({ queryKey: ['all-payment-schedules'] })
              toast.success('복원됐습니다')
            })
            .catch(() => toast.error('복원에 실패했습니다')),
        },
      } : undefined)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_completed }: { id: string; is_completed: boolean }) =>
      togglePaymentCompleted(id, is_completed),
    onSuccess: (_d, { is_completed }) => {
      qc.invalidateQueries({ queryKey: ['payment-schedules', voyageId] })
      qc.invalidateQueries({ queryKey: ['all-payment-schedules'] })
      toast.success(is_completed ? '완료 처리됐습니다' : '미완료로 변경됐습니다')
    },
    onError: () => toast.error('변경에 실패했습니다'),
  })

  function addDepositRow() {
    const newCount = extraCounts.PAYMENT + 1
    const newPt = `DEPOSIT_${2 + newCount}`
    setExtraCounts(prev => ({ ...prev, PAYMENT: newCount }))
    setDrafts(prev => {
      const next = { ...prev }
      for (const c of CATEGORIES) {
        next[makeDraftKey('PAYMENT', c, newPt)] = emptyCell()
      }
      return next
    })
  }

  function addRefundCard(category: PaymentCategory) {
    const newCount = refundCardCounts[category] + 1
    const pt = `REFUND_${newCount}`
    setRefundCardCounts(prev => ({ ...prev, [category]: newCount }))
    setDrafts(prev => ({
      ...prev,
      [makeDraftKey('REFUND', category, pt)]: emptyCell(),
    }))
  }

  function getCell(section: string, c: PaymentCategory, pt: string): DraftCell {
    return drafts[makeDraftKey(section, c, pt)] ?? emptyCell()
  }

  function updateCell(key: DraftKey, patch: Partial<DraftCell>) {
    setDrafts(prev => ({ ...prev, [key]: { ...(prev[key] ?? emptyCell()), ...patch } }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-800">결제 스케줄</h2>
          <p className="text-sm text-slate-400">크루즈·항공·호텔 데포짓 및 잔금 마감일 관리</p>
        </div>
        {thisMonthMode && (
          <button
            onClick={() => { setThisMonthMode(false); setVoyageId('') }}
            className="flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-2.5 py-0.5 text-xs font-medium hover:bg-orange-200 transition"
          >
            이번달 결제 마감
            <span className="ml-0.5 opacity-60">✕</span>
          </button>
        )}
      </div>

      {/* 행사 선택 */}
      <div>
        <label className="label">행사 선택</label>
        <div className="flex items-center gap-2 flex-wrap">
          <YearSelect
            value={thisMonthMode ? 'ALL' : yearFilter}
            years={years}
            onChange={y => {
              setYearFilter(y)
              setThisMonthMode(false)
              const sel = voyages.find(v => v.id === voyageId)
              if (sel && y !== 'ALL' && !sel.departure_date?.startsWith(y)) setVoyageId('')
            }}
          />
          <FieldSelect
            value={voyageId}
            options={filteredVoyages.map(v => ({ value: v.id, label: voyageTitle(v) }))}
            onChange={setVoyageId}
            placeholder="행사를 선택하세요"
            className="w-72"
          />
          {voyageId && (
            <button
              onClick={() => navigate(`/voyages?tab=항차검색&voyage=${voyageId}`)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand transition"
              title="항차 상세에서 보기"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              항차 상세
            </button>
          )}
        </div>
      </div>

      {!voyageId && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center text-sm text-slate-400">
          행사를 선택하면 결제 스케줄을 관리할 수 있습니다
        </div>
      )}

      {voyageId && isLoading && (
        <div className="py-16 text-center text-sm text-slate-400">불러오는 중…</div>
      )}

      {voyageId && !isLoading && (
        <div className="space-y-8">
          {/* 결제 섹션 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">결제</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <th className="w-28 pb-3" />
                {CATEGORIES.map(c => (
                  <th key={c} className="pb-3 px-2 text-center">
                    <span className={`inline-block text-xs font-bold rounded-full px-3 py-1 border ${CATEGORY_STYLE[c].header}`}>
                      {CATEGORY_LABEL[c]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 총 금액 행 */}
              <tr className="border-b-2 border-slate-300">
                <td className="pr-3 py-3 align-top">
                  <span className="text-xs font-bold text-slate-700 leading-none">총 금액</span>
                </td>
                {CATEGORIES.map(c => {
                  const key = makeDraftKey('PAYMENT', c, 'TOTAL')
                  const cell = getCell('PAYMENT', c, 'TOTAL')
                  const isEdit = editing === key
                  return (
                    <td key={c} className="px-2 py-3 align-top w-[200px]">
                      <div className={`rounded-xl border p-3 min-h-[60px] transition-all ${
                        isEdit
                          ? 'border-brand/40 bg-brand/5 shadow-sm'
                          : cell.amount
                          ? `${CATEGORY_STYLE[c].card} border-2`
                          : 'border-dashed border-slate-200 bg-slate-50/50'
                      }`}>
                        {isEdit ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="label">금액</label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={cell.amount}
                                  onChange={e => updateCell(key, { amount: e.target.value })}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="label">통화</label>
                                <FieldSelect
                                  value={cell.currency}
                                  options={CURRENCIES.map(cur => ({ value: cur, label: cur }))}
                                  onChange={v => updateCell(key, { currency: v })}
                                />
                              </div>
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <button
                                type="button"
                                disabled={!cell.amount || upsertMut.isPending}
                                onClick={() => upsertMut.mutate({ key, cell })}
                                className="flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium bg-brand text-white hover:bg-brand-dark transition disabled:opacity-40"
                              >
                                <Save className="h-3 w-3" />
                                {upsertMut.isPending ? '저장 중…' : '저장'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="px-2 rounded-lg text-xs text-slate-400 hover:bg-slate-100 transition"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : cell.amount ? (
                          <div className="space-y-1.5">
                            <span className="text-base font-bold leading-tight block">
                              {formatAmount(cell.amount, cell.currency)}
                            </span>
                            <div className="flex gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => setEditing(key)}
                                className="flex-1 text-center text-[11px] opacity-50 hover:opacity-100 py-0.5 rounded hover:bg-black/5 transition"
                              >
                                편집
                              </button>
                              {cell.id && (
                                <button
                                  type="button"
                                  onClick={() => cell.id && setDeleteTarget({ id: cell.id, label: `총 금액 ${CATEGORY_LABEL[c]}` })}
                                  className="px-1.5 text-[11px] opacity-40 hover:opacity-100 hover:text-red-500 rounded hover:bg-red-50 transition"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditing(key)}
                            className="w-full h-full flex items-center justify-center py-3 text-xs text-slate-400 hover:text-brand transition"
                          >
                            + 추가
                          </button>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
              {getPaymentTypes(extraCounts.PAYMENT).map((pt, ptIdx, allPts) => (
                <tr key={pt} className={ptIdx < allPts.length - 1 ? 'border-b border-slate-100' : ''}>
                  <td className="pr-3 py-3 align-top">
                    <span className="text-xs font-semibold text-slate-500 leading-none">
                      {paymentTypeLabel(pt)}
                    </span>
                  </td>
                  {CATEGORIES.map(c => {
                    const key = makeDraftKey('PAYMENT', c, pt)
                    const cell = getCell('PAYMENT', c, pt)
                    const isEdit = editing === key

                    return (
                      <td key={c} className="px-2 py-3 align-top w-[200px]">
                        <div className={`rounded-xl border p-3 min-h-[80px] transition-all ${
                          isEdit
                            ? 'border-brand/40 bg-brand/5 shadow-sm'
                            : cell.due_date
                            ? CATEGORY_STYLE[c].card
                            : 'border-dashed border-slate-200 bg-slate-50/50'
                        }`}>
                          {isEdit ? (
                            <div className="space-y-2">
                              <div>
                                <label className="label">마감일 *</label>
                                <DatePicker
                                  value={cell.due_date}
                                  onChange={v => updateCell(key, { due_date: v })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="label">금액</label>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={cell.amount}
                                    onChange={e => updateCell(key, { amount: e.target.value })}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="label">통화</label>
                                  <FieldSelect
                                    value={cell.currency}
                                    options={CURRENCIES.map(cur => ({ value: cur, label: cur }))}
                                    onChange={v => updateCell(key, { currency: v })}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="label">메모</label>
                                <Input
                                  value={cell.memo}
                                  onChange={e => updateCell(key, { memo: e.target.value })}
                                  placeholder="메모 (선택)"
                                />
                              </div>
                              <div className="flex gap-1.5 pt-1">
                                <button
                                  type="button"
                                  disabled={!cell.due_date || upsertMut.isPending}
                                  onClick={() => upsertMut.mutate({ key, cell })}
                                  className="flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium bg-brand text-white hover:bg-brand-dark transition disabled:opacity-40"
                                >
                                  <Save className="h-3 w-3" />
                                  {upsertMut.isPending ? '저장 중…' : '저장'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditing(null)}
                                  className="px-2 rounded-lg text-xs text-slate-400 hover:bg-slate-100 transition"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : cell.due_date ? (
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-1">
                                <span className="text-sm font-bold leading-tight">
                                  {formatAmount(cell.amount, cell.currency)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (cell.id) {
                                      const next = !cell.is_completed
                                      updateCell(key, { is_completed: next })
                                      toggleMut.mutate({ id: cell.id, is_completed: next })
                                    }
                                  }}
                                  className={`shrink-0 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold border transition ${
                                    cell.is_completed
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : 'bg-white/70 text-inherit border-current opacity-50 hover:opacity-100'
                                  }`}
                                >
                                  <Check className="h-2.5 w-2.5" />
                                  {cell.is_completed ? '완료' : '미완료'}
                                </button>
                              </div>
                              <p className={`text-[11px] ${cell.is_completed ? 'line-through opacity-50' : 'opacity-75'}`}>
                                마감 {cell.due_date}
                              </p>
                              {cell.memo && (
                                <p className="text-xs font-medium text-red-600 truncate">{cell.memo}</p>
                              )}
                              <div className="flex gap-1 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => setEditing(key)}
                                  className="flex-1 text-center text-[11px] opacity-50 hover:opacity-100 py-0.5 rounded hover:bg-black/5 transition"
                                >
                                  편집
                                </button>
                                {cell.id && (
                                  <button
                                    type="button"
                                    onClick={() => cell.id && setDeleteTarget({ id: cell.id, label: `결제 ${CATEGORY_LABEL[c]} ${paymentTypeLabel(pt)}` })}
                                    className="px-1.5 text-[11px] opacity-40 hover:opacity-100 hover:text-red-500 rounded hover:bg-red-50 transition"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditing(key)}
                              className="w-full h-full flex items-center justify-center py-4 text-xs text-slate-400 hover:text-brand transition"
                            >
                              + 추가
                            </button>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <button
            type="button"
            onClick={addDepositRow}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:border-brand hover:text-brand transition"
          >
            <Plus className="h-3.5 w-3.5" />
            데포짓 추가
          </button>
        </div>
          </div>

          {/* 환불 섹션 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">환불</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr>
                    {CATEGORIES.map(c => (
                      <th key={c} className="pb-3 px-2 text-center">
                        <span className={`inline-block text-xs font-bold rounded-full px-3 py-1 border ${CATEGORY_STYLE[c].header}`}>
                          {CATEGORY_LABEL[c]}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {CATEGORIES.map(c => (
                      <td key={c} className="px-2 py-3 align-top w-[200px]">
                        <div className="space-y-2">
                          {Array.from({ length: refundCardCounts[c] }, (_, i) => {
                            const pt = `REFUND_${i + 1}`
                            const rKey = makeDraftKey('REFUND', c, pt)
                            const rCell = getCell('REFUND', c, pt)
                            const rIsEdit = editing === rKey
                            return (
                    <div key={rKey} className={`rounded-xl border p-3 min-h-[80px] transition-all ${
                      rIsEdit
                        ? 'border-brand/40 bg-brand/5 shadow-sm'
                        : rCell.due_date
                        ? CATEGORY_STYLE[c].card
                        : 'border-dashed border-slate-200 bg-slate-50/50'
                    }`}>
                      {rIsEdit ? (
                        <div className="space-y-2">
                          <div>
                            <label className="label">환불일 *</label>
                            <DatePicker
                              value={rCell.due_date}
                              onChange={v => updateCell(rKey, { due_date: v })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="label">금액</label>
                              <Input
                                type="number"
                                min={0}
                                value={rCell.amount}
                                onChange={e => updateCell(rKey, { amount: e.target.value })}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="label">통화</label>
                              <FieldSelect
                                value={rCell.currency}
                                options={CURRENCIES.map(cur => ({ value: cur, label: cur }))}
                                onChange={v => updateCell(rKey, { currency: v })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="label">메모</label>
                            <Input
                              value={rCell.memo}
                              onChange={e => updateCell(rKey, { memo: e.target.value })}
                              placeholder="메모 (선택)"
                            />
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <button
                              type="button"
                              disabled={!rCell.due_date || upsertMut.isPending}
                              onClick={() => upsertMut.mutate({ key: rKey, cell: rCell })}
                              className="flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium bg-brand text-white hover:bg-brand-dark transition disabled:opacity-40"
                            >
                              <Save className="h-3 w-3" />
                              {upsertMut.isPending ? '저장 중…' : '저장'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="px-2 rounded-lg text-xs text-slate-400 hover:bg-slate-100 transition"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : rCell.due_date ? (
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-sm font-bold leading-tight">
                              {formatAmount(rCell.amount, rCell.currency)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (rCell.id) {
                                  const next = !rCell.is_completed
                                  updateCell(rKey, { is_completed: next })
                                  toggleMut.mutate({ id: rCell.id, is_completed: next })
                                }
                              }}
                              className={`shrink-0 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold border transition ${
                                rCell.is_completed
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-white/70 text-inherit border-current opacity-50 hover:opacity-100'
                              }`}
                            >
                              <Check className="h-2.5 w-2.5" />
                              {rCell.is_completed ? '완료' : '미완료'}
                            </button>
                          </div>
                          <p className={`text-[11px] ${rCell.is_completed ? 'line-through opacity-50' : 'opacity-75'}`}>
                            환불 {rCell.due_date}
                          </p>
                          {rCell.memo && (
                            <p className="text-xs font-medium text-red-600 truncate">{rCell.memo}</p>
                          )}
                          <div className="flex gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setEditing(rKey)}
                              className="flex-1 text-center text-[11px] opacity-50 hover:opacity-100 py-0.5 rounded hover:bg-black/5 transition"
                            >
                              편집
                            </button>
                            {rCell.id && (
                              <button
                                type="button"
                                onClick={() => rCell.id && setDeleteTarget({ id: rCell.id, label: `환불 ${i + 1}번` })}
                                className="px-1.5 text-[11px] opacity-40 hover:opacity-100 hover:text-red-500 rounded hover:bg-red-50 transition"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditing(rKey)}
                          className="w-full h-full flex items-center justify-center py-4 text-xs text-slate-400 hover:text-brand transition"
                        >
                          + 추가
                        </button>
                      )}
                            </div>
                            )
                          })}
                          <button
                            type="button"
                            onClick={() => addRefundCard(c)}
                            className="w-full flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 py-1.5 text-xs text-slate-400 hover:border-brand hover:text-brand transition"
                          >
                            <Plus className="h-3 w-3" />
                            추가
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          message={`${deleteTarget.label} 결제 정보를 삭제합니다.`}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          pending={deleteMut.isPending}
        />
      )}
    </div>
  )
}
