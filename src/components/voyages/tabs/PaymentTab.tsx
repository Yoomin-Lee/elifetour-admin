import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Save, Trash2, ExternalLink, Plus, GripVertical, X } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { fetchVoyages } from '@/lib/queries/voyages'
import {
  fetchPaymentSchedules,
  fetchPaymentSchedulesByMonth,
  fetchPaymentColOrder,
  upsertPaymentSchedule,
  deletePaymentSchedule,
  restorePaymentSchedule,
  togglePaymentCompleted,
  savePaymentColOrder,
  deleteAgentColumn,
} from '@/lib/queries/paymentSchedules'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { AutoTextarea } from '@/components/ui/auto-textarea'
import { YearSelect } from '@/components/ui/year-select'
import { FieldSelect } from '@/components/ui/field-select'
import { voyageTitle } from '@/types/database'
import type { PaymentCategory, PaymentColumn } from '@/types/database'
import type { PaymentSchedule } from '@/types/database'

// ─── 상수 ──────────────────────────────────────────────────────────────────

const BASE_CATEGORIES: PaymentCategory[] = ['CRUISE', 'FLIGHT', 'HOTEL', 'LAND', 'INSURANCE']
const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY'] as const

const CATEGORY_LABEL: Record<PaymentCategory, string> = {
  CRUISE: '크루즈', FLIGHT: '항공', HOTEL: '호텔', LAND: '랜드', INSURANCE: '보험',
}

const DEFAULT_COLUMNS: PaymentColumn[] = BASE_CATEGORIES.map(cat => ({
  colId:        `${cat}_default`,
  baseCategory: cat,
  agentId:      'default',
  label:        CATEGORY_LABEL[cat],
}))

const CATEGORY_STYLE: Record<PaymentCategory, { header: string; card: string }> = {
  CRUISE:    { header: 'text-cyan-700 bg-cyan-50 border-cyan-200',     card: 'border-cyan-200 bg-cyan-50/60 text-cyan-900' },
  FLIGHT:    { header: 'text-amber-700 bg-amber-50 border-amber-200',  card: 'border-amber-200 bg-amber-50/60 text-amber-900' },
  HOTEL:     { header: 'text-emerald-700 bg-emerald-50 border-emerald-200', card: 'border-emerald-200 bg-emerald-50/60 text-emerald-900' },
  LAND:      { header: 'text-violet-700 bg-violet-50 border-violet-200', card: 'border-violet-200 bg-violet-50/60 text-violet-900' },
  INSURANCE: { header: 'text-rose-700 bg-rose-50 border-rose-200',     card: 'border-rose-200 bg-rose-50/60 text-rose-900' },
}

// ─── 타입 ──────────────────────────────────────────────────────────────────

type DraftCell = {
  id?: string
  amount: string
  currency: string
  due_date: string
  is_completed: boolean
  memo: string
}

// DraftKey: `${section}::${colId}::${payment_type}`  (:: 구분자로 언더스코어 충돌 방지)
type DraftKey = string

function makeDraftKey(section: string, colId: string, pt: string): DraftKey {
  return `${section}::${colId}::${pt}`
}

function parseDraftKey(key: DraftKey): { section: string; colId: string; pt: string } {
  const [section, colId, pt] = key.split('::')
  return { section, colId, pt }
}

function getPaymentTypes(extra: number): string[] {
  const rows: string[] = ['DEPOSIT_1ST', 'DEPOSIT_2ND']
  for (let i = 3; i <= 2 + extra; i++) rows.push(`DEPOSIT_${i}`)
  rows.push('BALANCE')
  return rows
}

function paymentTypeLabel(pt: string): string {
  if (pt === 'TOTAL')        return '총 금액'
  if (pt === 'DEPOSIT_1ST')  return '1차 데포짓'
  if (pt === 'DEPOSIT_2ND')  return '2차 데포짓'
  if (pt === 'BALANCE')      return '잔금'
  const m = pt.match(/^DEPOSIT_(\d+)$/)
  if (m) return `${m[1]}차 데포짓`
  return pt
}

function emptyCell(): DraftCell {
  return { amount: '', currency: 'KRW', due_date: '', is_completed: false, memo: '' }
}

function fromSchedule(s: PaymentSchedule): DraftCell {
  return {
    id:           s.id,
    amount:       s.amount > 0 ? String(s.amount) : '',
    currency:     s.currency,
    due_date:     s.due_date ?? '',
    is_completed: s.is_completed,
    memo:         s.memo ?? '',
  }
}

function formatAmount(amount: string, currency: string): string {
  const n = Number(amount)
  if (!n) return '—'
  const sym: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥' }
  const prefix = sym[currency] ?? (currency + ' ')
  return prefix + n.toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
}

// ─── SortableColumnHeader ──────────────────────────────────────────────────

interface SortableColumnHeaderProps {
  col: PaymentColumn
  onAddAgent: (baseCategory: PaymentCategory) => void
  onDeleteAgent: (col: PaymentColumn) => void
  onLabelChange: (colId: string, label: string) => void
  onLabelBlur: () => void
  editingLabel: string | null   // colId being label-edited
  setEditingLabel: (id: string | null) => void
}

function SortableColumnHeader({
  col, onAddAgent, onDeleteAgent, onLabelChange, onLabelBlur, editingLabel, setEditingLabel,
}: SortableColumnHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: col.colId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isAgent = col.agentId !== 'default'

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`pb-2 px-2 text-center transition-opacity ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* 드래그 핸들 + 태그 */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1 group">
          {/* 드래그 핸들 */}
          <button
            type="button"
            className="cursor-grab opacity-30 group-hover:opacity-70 transition touch-none"
            {...attributes}
            {...listeners}
            title="드래그해서 순서 변경"
          >
            <GripVertical className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* 태그 레이블 */}
          {editingLabel === col.colId ? (
            <input
              autoFocus
              value={col.label}
              onChange={e => onLabelChange(col.colId, e.target.value)}
              onBlur={onLabelBlur}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') onLabelBlur() }}
              className={`text-xs font-bold rounded-full px-2 py-0.5 border outline-none w-24 text-center ${CATEGORY_STYLE[col.baseCategory].header}`}
            />
          ) : (
            <span
              className={`inline-block text-xs font-bold rounded-full px-3 py-1 border ${CATEGORY_STYLE[col.baseCategory].header} cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-brand/40 transition`}
              onClick={() => setEditingLabel(col.colId)}
              title="클릭해서 이름 변경"
            >
              {col.label}
            </span>
          )}

          {/* 에이전트 열 삭제 버튼 */}
          {isAgent && (
            <button
              type="button"
              onClick={() => onDeleteAgent(col)}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition rounded-full hover:bg-red-50 p-0.5"
              title="이 열 삭제"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* + 에이전트 추가 버튼 */}
        <button
          type="button"
          onClick={() => onAddAgent(col.baseCategory)}
          className="flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-brand transition opacity-60 hover:opacity-100"
          title={`${CATEGORY_LABEL[col.baseCategory]} 에이전트 추가`}
        >
          <Plus className="h-2.5 w-2.5" />
          에이전트 추가
        </button>
      </div>
    </th>
  )
}

// ─── PaymentTab ────────────────────────────────────────────────────────────

export default function PaymentTab() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const urlVoyageId   = searchParams.get('voyage') ?? ''
  const urlFilter     = searchParams.get('filter')
  const [voyageId, setVoyageId]           = useState(urlVoyageId)
  const [yearFilter, setYearFilter]       = useState<string>('ALL')
  const [thisMonthMode, setThisMonthMode] = useState(urlFilter === 'this-month')
  const now = new Date()
  const didAutoSelectRef = useRef(false)

  useEffect(() => { if (urlVoyageId) setVoyageId(urlVoyageId) }, [urlVoyageId])

  // ─ 편집 상태
  const [editing, setEditing]         = useState<DraftKey | null>(null)
  const [drafts, setDrafts]           = useState<Record<DraftKey, DraftCell>>({})
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleteColTarget, setDeleteColTarget] = useState<PaymentColumn | null>(null)

  // ─ 열 상태
  const [columns, setColumns]         = useState<PaymentColumn[]>(DEFAULT_COLUMNS)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)  // colId

  // ─ 행 상태
  const [extraCounts, setExtraCounts]         = useState({ PAYMENT: 0 })
  const [refundCardCounts, setRefundCardCounts] = useState<Record<string, number>>({})

  const qc = useQueryClient()

  // ─ Voyages 목록
  const { data: voyages = [] } = useQuery({ queryKey: ['voyages'], queryFn: fetchVoyages })

  const years = useMemo(() => {
    const ys = new Set<string>()
    voyages.forEach(v => { if (v.departure_date) ys.add(v.departure_date.slice(0, 4)) })
    return Array.from(ys).sort().reverse()
  }, [voyages])

  // ─ 이번달 결제 필터
  const { data: thisMonthSchedules = [] } = useQuery({
    queryKey: ['payment-schedules-month', now.getFullYear(), now.getMonth() + 1],
    queryFn:  () => fetchPaymentSchedulesByMonth(now.getFullYear(), now.getMonth() + 1),
    enabled:  thisMonthMode,
  })

  const thisMonthVoyageIds = useMemo(() => {
    if (!thisMonthMode) return null
    return new Set(thisMonthSchedules.map(s => s.voyage_id))
  }, [thisMonthMode, thisMonthSchedules])

  const filteredVoyages = useMemo(() => {
    const sorted = [...voyages].sort((a, b) => (b.departure_date ?? '').localeCompare(a.departure_date ?? ''))
    if (thisMonthVoyageIds) return sorted.filter(v => thisMonthVoyageIds.has(v.id))
    if (yearFilter === 'ALL') return sorted
    return sorted.filter(v => v.departure_date?.startsWith(yearFilter))
  }, [voyages, yearFilter, thisMonthVoyageIds])

  useEffect(() => {
    if (thisMonthMode && !voyageId && filteredVoyages.length > 0 && !didAutoSelectRef.current) {
      didAutoSelectRef.current = true
      setVoyageId(filteredVoyages[0].id)
    }
  }, [thisMonthMode, filteredVoyages, voyageId])

  // ─ 결제 스케줄 데이터
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['payment-schedules', voyageId],
    queryFn:  () => fetchPaymentSchedules(voyageId),
    enabled:  !!voyageId,
  })

  // ─ 선택된 voyage의 열 순서 (payment_col_order)
  const { data: voyageColOrder } = useQuery({
    queryKey: ['voyage-col-order', voyageId],
    queryFn:  () => fetchPaymentColOrder(voyageId),
    enabled:  !!voyageId,
  })

  // ─ 열 순서 초기화 (voyage 선택 or DB 데이터 로드 시)
  useEffect(() => {
    if (!voyageId) return

    if (voyageColOrder && voyageColOrder.length > 0) {
      // DB 저장된 열 구성이 있으면 사용
      setColumns(voyageColOrder)
    } else {
      // 없으면 기본 5열
      setColumns(DEFAULT_COLUMNS)
    }
  }, [voyageId, voyageColOrder])

  // ─ drafts 초기화 (schedules 로드 시)
  useEffect(() => {
    if (!voyageId) return

    // extraCounts 계산
    const depositNums = schedules
      .filter(s => (s.section ?? 'PAYMENT') === 'PAYMENT' && s.agent_id === 'default')
      .map(s => s.payment_type)
      .filter(pt => /^DEPOSIT_(\d+)$/.test(pt))
      .map(pt => parseInt(pt.replace('DEPOSIT_', ''), 10))
    const paymentExtra = depositNums.length > 0 ? Math.max(0, Math.max(...depositNums) - 2) : 0
    setExtraCounts({ PAYMENT: paymentExtra })

    // refundCardCounts 계산 (모든 category+agent_id 조합)
    const newRefundCounts: Record<string, number> = {}
    const refundRows = schedules.filter(s => (s.section ?? 'PAYMENT') === 'REFUND')
    for (const s of refundRows) {
      const key = `${s.category}::${s.agent_id ?? 'default'}`
      const m   = s.payment_type.match(/^REFUND_(\d+)$/)
      if (m) {
        const n = parseInt(m[1], 10)
        newRefundCounts[key] = Math.max(newRefundCounts[key] ?? 0, n)
      }
    }
    setRefundCardCounts(newRefundCounts)

    // drafts 재구성 (현재 columns 기반)
    setColumns(prev => {
      const next: Record<DraftKey, DraftCell> = {}
      const paymentTypes = getPaymentTypes(paymentExtra)

      for (const col of prev) {
        // 총 금액 행
        const totalKey = makeDraftKey('PAYMENT', col.colId, 'TOTAL')
        const totalExisting = schedules.find(s =>
          s.category === col.baseCategory &&
          (s.agent_id ?? 'default') === col.agentId &&
          s.payment_type === 'TOTAL' &&
          (s.section ?? 'PAYMENT') === 'PAYMENT'
        )
        next[totalKey] = totalExisting ? fromSchedule(totalExisting) : emptyCell()

        // 결제 행
        for (const pt of paymentTypes) {
          const k = makeDraftKey('PAYMENT', col.colId, pt)
          const existing = schedules.find(s =>
            s.category === col.baseCategory &&
            (s.agent_id ?? 'default') === col.agentId &&
            s.payment_type === pt &&
            (s.section ?? 'PAYMENT') === 'PAYMENT'
          )
          next[k] = existing ? fromSchedule(existing) : emptyCell()
        }

        // 환불 행
        const refKey = `${col.baseCategory}::${col.agentId}`
        const rCount = newRefundCounts[refKey] ?? 0
        for (let i = 1; i <= rCount; i++) {
          const pt = `REFUND_${i}`
          const rk = makeDraftKey('REFUND', col.colId, pt)
          const existing = schedules.find(s =>
            s.category === col.baseCategory &&
            (s.agent_id ?? 'default') === col.agentId &&
            s.payment_type === pt &&
            (s.section ?? 'PAYMENT') === 'REFUND'
          )
          next[rk] = existing ? fromSchedule(existing) : emptyCell()
        }
      }

      setDrafts(next)
      setEditing(null)
      return prev
    })
  }, [schedules, voyageId])

  // ─── mutations ────────────────────────────────────────────────────────────

  const colOrderMut = useMutation({
    mutationFn: (cols: PaymentColumn[]) => savePaymentColOrder(voyageId, cols),
    onError: () => toast.error('열 순서 저장에 실패했습니다'),
  })

  const deleteAgentColMut = useMutation({
    mutationFn: (agentId: string) => deleteAgentColumn(voyageId, agentId),
    onSuccess: (_r, agentId) => {
      qc.invalidateQueries({ queryKey: ['payment-schedules', voyageId] })
      qc.invalidateQueries({ queryKey: ['voyage-col-order', voyageId] })
      setColumns(prev => prev.filter(c => !(c.agentId === agentId && agentId !== 'default')))
      setDeleteColTarget(null)
      toast.success('에이전트 열이 삭제됐습니다')
    },
    onError: () => toast.error('열 삭제에 실패했습니다'),
  })

  const upsertMut = useMutation({
    mutationFn: ({ key, cell }: { key: DraftKey; cell: DraftCell }) => {
      const { section, colId, pt } = parseDraftKey(key)
      const col = columns.find(c => c.colId === colId)
      if (!col) throw new Error('열을 찾을 수 없습니다')
      return upsertPaymentSchedule({
        voyage_id:    voyageId,
        category:     col.baseCategory,
        payment_type: pt,
        section,
        agent_id:     col.agentId,
        amount:       Number(cell.amount) || 0,
        currency:     cell.currency,
        due_date:     pt === 'TOTAL' ? null : (cell.due_date || null),
        is_completed: cell.is_completed,
        memo:         cell.memo || null,
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
    onMutate:   (id: string) => ({ snapshot: schedules.find(s => s.id === id) ?? null }),
    onSuccess: (_r, _id, ctx) => {
      qc.invalidateQueries({ queryKey: ['payment-schedules', voyageId] })
      qc.invalidateQueries({ queryKey: ['all-payment-schedules'] })
      setDeleteTarget(null)
      const snap = ctx?.snapshot
      toast.success('삭제되었습니다', snap ? {
        action: {
          label:   '되돌리기',
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

  // ─── 열 조작 함수 ─────────────────────────────────────────────────────────

  function addAgentColumn(baseCategory: PaymentCategory) {
    const agentId = crypto.randomUUID()
    const colId   = `${baseCategory}_${agentId}`
    const newCol: PaymentColumn = {
      colId,
      baseCategory,
      agentId,
      label: CATEGORY_LABEL[baseCategory],
    }

    setColumns(prev => {
      // 같은 baseCategory 마지막 열 다음에 삽입
      const lastIdx = prev.reduce((acc, c, i) => c.baseCategory === baseCategory ? i : acc, -1)
      const next = [...prev]
      next.splice(lastIdx + 1, 0, newCol)

      // 새 열의 빈 draft 등록
      const paymentTypes = getPaymentTypes(extraCounts.PAYMENT)
      setDrafts(d => {
        const nd = { ...d }
        nd[makeDraftKey('PAYMENT', colId, 'TOTAL')] = emptyCell()
        for (const pt of paymentTypes) nd[makeDraftKey('PAYMENT', colId, pt)] = emptyCell()
        return nd
      })

      colOrderMut.mutate(next)
      return next
    })
    // 추가 후 레이블 편집 모드 진입
    setTimeout(() => setEditingLabel(colId), 50)
  }

  function handleLabelChange(colId: string, label: string) {
    setColumns(prev => prev.map(c => c.colId === colId ? { ...c, label } : c))
  }

  function handleLabelBlur() {
    setEditingLabel(null)
    colOrderMut.mutate(columns)
  }

  // ─── 드래그 앤 드롭 ───────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = columns.findIndex(c => c.colId === active.id)
    const newIdx = columns.findIndex(c => c.colId === over.id)
    const next   = arrayMove(columns, oldIdx, newIdx)
    setColumns(next)
    colOrderMut.mutate(next)
  }

  // ─── 헬퍼 ─────────────────────────────────────────────────────────────────

  function getCell(section: string, colId: string, pt: string): DraftCell {
    return drafts[makeDraftKey(section, colId, pt)] ?? emptyCell()
  }

  function updateCell(key: DraftKey, patch: Partial<DraftCell>) {
    setDrafts(prev => ({ ...prev, [key]: { ...(prev[key] ?? emptyCell()), ...patch } }))
  }

  function addDepositRow() {
    const newCount = extraCounts.PAYMENT + 1
    const newPt    = `DEPOSIT_${2 + newCount}`
    setExtraCounts(prev => ({ ...prev, PAYMENT: newCount }))
    setDrafts(prev => {
      const nd = { ...prev }
      for (const col of columns) nd[makeDraftKey('PAYMENT', col.colId, newPt)] = emptyCell()
      return nd
    })
  }

  function addRefundCard(colId: string) {
    const col    = columns.find(c => c.colId === colId)
    if (!col) return
    const refKey = `${col.baseCategory}::${col.agentId}`
    const newCount = (refundCardCounts[refKey] ?? 0) + 1
    const pt       = `REFUND_${newCount}`
    setRefundCardCounts(prev => ({ ...prev, [refKey]: newCount }))
    setDrafts(prev => ({ ...prev, [makeDraftKey('REFUND', colId, pt)]: emptyCell() }))
  }

  // ─── 렌더 ─────────────────────────────────────────────────────────────────

  const paymentTypes = getPaymentTypes(extraCounts.PAYMENT)
  const colIds       = columns.map(c => c.colId)

  function renderCell(
    section: string,
    col: PaymentColumn,
    pt: string,
    allPts: string[],
  ) {
    const key    = makeDraftKey(section, col.colId, pt)
    const cell   = getCell(section, col.colId, pt)
    const isEdit = editing === key
    const style  = CATEGORY_STYLE[col.baseCategory]

    const calcBalance = (pt === 'BALANCE' && section === 'PAYMENT') ? (() => {
      const totalCell = getCell('PAYMENT', col.colId, 'TOTAL')
      if (!totalCell.amount) return null
      const totalAmt = Number(totalCell.amount)
      const totalCur = totalCell.currency
      const depositSum = allPts
        .filter(p => p !== 'BALANCE')
        .reduce((s, dt) => {
          const dc = getCell('PAYMENT', col.colId, dt)
          return s + (dc.currency === totalCur ? Number(dc.amount) || 0 : 0)
        }, 0)
      return { amount: totalAmt - depositSum, currency: totalCur }
    })() : null

    return (
      <div className={`rounded-xl border p-3 min-h-[80px] transition-all ${
        isEdit
          ? 'border-brand/40 bg-brand/5 shadow-sm'
          : (cell.due_date || calcBalance || (pt === 'TOTAL' && cell.amount))
          ? (pt === 'TOTAL' ? `${style.card} border-2` : style.card)
          : 'border-dashed border-slate-200 bg-slate-50/50'
      }`}>
        {isEdit ? (
          <div className="space-y-2">
            {pt !== 'TOTAL' && (
              <div>
                <label className="label">{section === 'REFUND' ? '환불일' : '마감일'} *</label>
                <DatePicker value={cell.due_date} onChange={v => updateCell(key, { due_date: v })} />
              </div>
            )}
            <div className={pt === 'TOTAL' ? '' : 'grid grid-cols-2 gap-1.5'}>
              <div>
                <label className="label">금액</label>
                <Input type="number" min={0} value={cell.amount}
                  onChange={e => updateCell(key, { amount: e.target.value })} placeholder="0" />
              </div>
              {pt === 'TOTAL' ? (
                <div className="mt-1.5">
                  <label className="label">통화</label>
                  <FieldSelect value={cell.currency}
                    options={CURRENCIES.map(cur => ({ value: cur, label: cur }))}
                    onChange={v => updateCell(key, { currency: v })} />
                </div>
              ) : (
                <div>
                  <label className="label">통화</label>
                  <FieldSelect value={cell.currency}
                    options={CURRENCIES.map(cur => ({ value: cur, label: cur }))}
                    onChange={v => updateCell(key, { currency: v })} />
                </div>
              )}
            </div>
            {pt !== 'TOTAL' && (
              <div>
                <label className="label">메모</label>
                <AutoTextarea value={cell.memo} onChange={e => updateCell(key, { memo: e.target.value })}
                  placeholder="메모 (선택)" />
              </div>
            )}
            <div className="flex gap-1.5 pt-1">
              <button type="button"
                disabled={(pt !== 'TOTAL' && !cell.due_date) || !cell.amount || upsertMut.isPending}
                onClick={() => upsertMut.mutate({ key, cell })}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium bg-brand text-white hover:bg-brand-dark transition disabled:opacity-40"
              >
                <Save className="h-3 w-3" />
                {upsertMut.isPending ? '저장 중…' : '저장'}
              </button>
              <button type="button" onClick={() => setEditing(null)}
                className="px-2 rounded-lg text-xs text-slate-400 hover:bg-slate-100 transition">
                취소
              </button>
            </div>
          </div>
        ) : (cell.due_date || calcBalance || (pt === 'TOTAL' && cell.amount)) ? (
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-1">
              <div>
                <span className="text-sm font-bold leading-tight block">
                  {pt === 'BALANCE' && calcBalance && !cell.amount
                    ? formatAmount(String(calcBalance.amount), calcBalance.currency)
                    : formatAmount(cell.amount, cell.currency)}
                </span>
                {pt === 'BALANCE' && calcBalance && cell.amount && (
                  <span className="text-[11px] opacity-55 block">
                    Σ {formatAmount(String(calcBalance.amount), calcBalance.currency)}
                  </span>
                )}
              </div>
              {cell.id && pt !== 'TOTAL' && (
                <button type="button"
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
              )}
            </div>
            {cell.due_date && (
              <p className={`text-[11px] ${cell.is_completed ? 'line-through opacity-50' : 'opacity-75'}`}>
                {section === 'REFUND' ? '환불' : '마감'} {cell.due_date}
              </p>
            )}
            {cell.memo && <p className="text-xs font-medium text-red-600 whitespace-pre-wrap break-words">{cell.memo}</p>}
            <div className="flex gap-1 pt-0.5">
              <button type="button" onClick={() => setEditing(key)}
                className="flex-1 text-center text-[11px] opacity-50 hover:opacity-100 py-0.5 rounded hover:bg-black/5 transition">
                편집
              </button>
              {cell.id && (
                <button type="button"
                  onClick={() => cell.id && setDeleteTarget({ id: cell.id, label: `${col.label} ${paymentTypeLabel(pt)}` })}
                  className="px-1.5 text-[11px] opacity-40 hover:opacity-100 hover:text-red-500 rounded hover:bg-red-50 transition">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(key)}
            className="w-full h-full flex items-center justify-center py-4 text-xs text-slate-400 hover:text-brand transition">
            + 추가
          </button>
        )}
      </div>
    )
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* 헤더 */}
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-8">

            {/* ── 결제 섹션 ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">결제</h3>
              <div className="overflow-x-auto scrollbar-navy">
                <table className="border-collapse" style={{ minWidth: `${112 + columns.length * 200}px` }}>
                  <thead>
                    <tr>
                      <th className="w-28 pb-3" />
                      <SortableContext items={colIds} strategy={horizontalListSortingStrategy}>
                        {columns.map(col => (
                          <SortableColumnHeader
                            key={col.colId}
                            col={col}
                            onAddAgent={addAgentColumn}
                            onDeleteAgent={c => setDeleteColTarget(c)}
                            onLabelChange={handleLabelChange}
                            onLabelBlur={handleLabelBlur}
                            editingLabel={editingLabel}
                            setEditingLabel={setEditingLabel}
                          />
                        ))}
                      </SortableContext>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 총 금액 행 */}
                    <tr className="border-b-2 border-slate-300">
                      <td className="pr-3 py-3 align-top">
                        <span className="text-xs font-bold text-slate-700 leading-none">총 금액</span>
                      </td>
                      {columns.map(col => (
                        <td key={col.colId} className="px-2 py-3 align-top w-[200px]">
                          {renderCell('PAYMENT', col, 'TOTAL', [])}
                        </td>
                      ))}
                    </tr>

                    {/* 데포짓/잔금 행 */}
                    {paymentTypes.map((pt, ptIdx) => (
                      <tr key={pt} className={ptIdx < paymentTypes.length - 1 ? 'border-b border-slate-100' : ''}>
                        <td className="pr-3 py-3 align-top">
                          <span className="text-xs font-semibold text-slate-500 leading-none">
                            {paymentTypeLabel(pt)}
                          </span>
                        </td>
                        {columns.map(col => (
                          <td key={col.colId} className="px-2 py-3 align-top w-[200px]">
                            {renderCell('PAYMENT', col, pt, paymentTypes)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addDepositRow}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:border-brand hover:text-brand transition"
              >
                <Plus className="h-3.5 w-3.5" />
                데포짓 추가
              </button>
            </div>

            {/* ── 환불 섹션 ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">환불</h3>
              <div className="overflow-x-auto scrollbar-navy">
                <table className="border-collapse" style={{ minWidth: `${112 + columns.length * 200}px` }}>
                  <thead>
                    <tr>
                      <th className="w-28 pb-3" />
                      {columns.map(col => (
                        <th key={col.colId} className="pb-3 px-2 text-center">
                          <span className={`inline-block text-xs font-bold rounded-full px-3 py-1 border ${CATEGORY_STYLE[col.baseCategory].header}`}>
                            {col.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* 총 환불 행 */}
                    <tr className="border-b-2 border-slate-300">
                      <td className="pr-3 py-3 align-middle">
                        <span className="text-xs font-bold text-slate-700 leading-none">총 환불</span>
                      </td>
                      {columns.map(col => {
                        const refKey = `${col.baseCategory}::${col.agentId}`
                        const rCount = refundCardCounts[refKey] ?? 0
                        const byCurrency: Record<string, number> = {}
                        for (let i = 1; i <= rCount; i++) {
                          const rCell = getCell('REFUND', col.colId, `REFUND_${i}`)
                          const n = Number(rCell.amount)
                          if (n > 0) byCurrency[rCell.currency] = (byCurrency[rCell.currency] || 0) + n
                        }
                        const totals = Object.entries(byCurrency)
                        return (
                          <td key={col.colId} className="px-2 py-3 align-middle w-[200px]">
                            <div className={`rounded-xl border p-3 min-h-[60px] flex flex-col justify-center ${
                              totals.length > 0
                                ? `${CATEGORY_STYLE[col.baseCategory].card} border-2`
                                : 'border-dashed border-slate-200 bg-slate-50/50'
                            }`}>
                              {totals.length > 0 ? (
                                <div className="space-y-0.5">
                                  {totals.map(([cur, amt]) => (
                                    <span key={cur} className="text-base font-bold leading-tight block">
                                      {formatAmount(String(amt), cur)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 text-center block">—</span>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>

                    {/* 환불 카드 행 */}
                    <tr>
                      <td className="w-28" />
                      {columns.map(col => {
                        const refKey = `${col.baseCategory}::${col.agentId}`
                        const rCount = refundCardCounts[refKey] ?? 0
                        return (
                          <td key={col.colId} className="px-2 py-3 align-top w-[200px]">
                            <div className="space-y-2">
                              {Array.from({ length: rCount }, (_, i) => {
                                const pt   = `REFUND_${i + 1}`
                                const rKey = makeDraftKey('REFUND', col.colId, pt)
                                return (
                                  <div key={rKey}>
                                    {renderCell('REFUND', col, pt, [])}
                                  </div>
                                )
                              })}
                              <button
                                type="button"
                                onClick={() => addRefundCard(col.colId)}
                                className="w-full flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 py-1.5 text-xs text-slate-400 hover:border-brand hover:text-brand transition"
                              >
                                <Plus className="h-3 w-3" />
                                추가
                              </button>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </DndContext>
      )}

      {/* 결제 데이터 삭제 확인 모달 */}
      {deleteTarget && (
        <ConfirmDeleteModal
          message={`${deleteTarget.label} 결제 정보를 삭제합니다.`}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          pending={deleteMut.isPending}
        />
      )}

      {/* 에이전트 열 삭제 확인 모달 */}
      {deleteColTarget && (
        <ConfirmDeleteModal
          message={`'${deleteColTarget.label}' 열과 해당 결제 데이터를 모두 삭제합니다. 되돌릴 수 없습니다.`}
          onConfirm={() => deleteAgentColMut.mutate(deleteColTarget.agentId)}
          onCancel={() => setDeleteColTarget(null)}
          pending={deleteAgentColMut.isPending}
        />
      )}
    </div>
  )
}
