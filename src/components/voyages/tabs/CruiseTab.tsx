import { useState, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { YearSelect } from '@/components/ui/year-select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Pencil, Check, X, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { fetchVoyages, updateVoyage, fetchCabinGrades, saveCabinGrades, fetchAllCabinGrades } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import type { Voyage, CabinGrade } from '@/types/database'

// ── 선사/선박명 프리셋 ────────────────────────────────────────────────────
const CRUISE_LINES: Record<string, string[]> = {
  'Royal Caribbean': [
    'Ovation of the Seas', 'Navigator of the Seas', 'Spectrum of the Seas',
    'Anthem of the Seas', 'Odyssey of the Seas', 'Allure of the Seas',
    'Voyager of the Seas', 'Quantum of the Seas', 'Oasis of the Seas',
    'Wonder of the Seas', 'Harmony of the Seas', 'Mariner of the Seas',
  ],
  'Costa Cruises': [
    'Costa Smeralda', 'Costa Toscana', 'Costa Firenze',
    'Costa Fascinosa', 'Costa Fortuna', 'Costa Serena',
    'Costa Diadema', 'Costa Luminosa',
  ],
  'MSC': [
    'MSC Bellissima', 'MSC World Europa', 'MSC World America',
    'MSC Splendida', 'MSC Magnifica', 'MSC Musica', 'MSC Orchestra',
    'MSC Virtuosa', 'MSC Seashore', 'MSC Seascape', 'MSC Grandiosa',
    'MSC Preziosa', 'MSC Poesia', 'MSC Meraviglia',
  ],
  'Holland America': [
    'Westerdam', 'Eurodam', 'Nieuw Statendam', 'Rotterdam',
    'Koningsdam', 'Volendam', 'Veendam',
  ],
  'Norwegian (NCL)': [
    'Norwegian Bliss', 'Norwegian Joy', 'Norwegian Prima',
    'Norwegian Encore', 'Norwegian Epic', 'Norwegian Viva',
  ],
  'Celebrity Cruises': [
    'Celebrity Solstice', 'Celebrity Millennium', 'Celebrity Beyond',
    'Celebrity Apex', 'Celebrity Edge', 'Celebrity Equinox',
  ],
  'Princess Cruises': [
    'Majestic Princess', 'Diamond Princess', 'Discovery Princess',
    'Ruby Princess', 'Sapphire Princess', 'Crown Princess',
  ],
  'Carnival': ['Carnival Jubilee', 'Carnival Celebration', 'Carnival Luminosa'],
}
const ALL_SHIPS = Object.values(CRUISE_LINES).flat()
const CABIN_GRADES = ['4D', '2D', 'BA2', 'BR1', '3D(FIT)', '4U', 'BM1', 'VD', '1D', '3D', 'VC', 'VE']

// ── SelectOrInput ─────────────────────────────────────────────────────────
function SelectOrInput({
  value,
  onChange,
  options,
  placeholder = '선택…',
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  const CUSTOM = '__CUSTOM__'
  const [isCustom, setIsCustom] = useState(() => value !== '' && !options.includes(value))

  if (isCustom) {
    return (
      <div className="flex gap-1">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="직접 입력"
          autoFocus
          className="input h-7 text-sm flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={() => { setIsCustom(false); onChange('') }}
          className="shrink-0 flex h-7 items-center rounded border border-slate-200 px-2 text-xs text-slate-400 hover:bg-slate-100 transition"
        >
          목록
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => {
          if (e.target.value === CUSTOM) { setIsCustom(true); onChange('') }
          else onChange(e.target.value)
        }}
        className="select h-7 py-0 text-sm appearance-none pr-7 w-full"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value={CUSTOM}>✏ 직접 입력</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
    </div>
  )
}

// ── 선실 편집 폼 ─────────────────────────────────────────────────────────
type CruiseForm = {
  cruise_line: string
  ship_name: string
  agent: string
  cabin_total: string
  cabin_remaining: string
  cabin_grade: string
  cabin_price: string
  cabin_currency: string
}
function toForm(v: Voyage): CruiseForm {
  return {
    cruise_line: v.cruise_line ?? '',
    ship_name: v.ship_name ?? '',
    agent: v.agent ?? '',
    cabin_total: String(v.cabin_total ?? ''),
    cabin_remaining: String(v.cabin_remaining ?? ''),
    cabin_grade: '',
    cabin_price: '',
    cabin_currency: 'KRW',
  }
}

// ── 등급 드래프트 ─────────────────────────────────────────────────────────
type DraftGrade = {
  _key: string; _isNew: boolean; _deleted: boolean
  id: string; grade: string; total: number; reserved: number
  price_per_person: number | null; currency: string; sort_order: number
}
const DEFAULT_GRADES = ['4D', '2D', 'BA2', 'BR1', '3D(FIT)', '4U', 'BM1', 'VD', '1D', '3D', 'VC', 'VE']

function formatPrice(price: number | null, currency: string): string {
  if (price == null) return '—'
  if (currency === 'KRW') return price.toLocaleString('ko-KR') + '원'
  if (currency === 'USD') return '$' + price.toLocaleString('en-US')
  return price.toLocaleString() + ' ' + currency
}

// ── 등급 현황 서브 패널 ───────────────────────────────────────────────────
function GradesPanel({ voyageId, canWrite }: { voyageId: string; canWrite: boolean }) {
  const qc = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<DraftGrade | null>(null)

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['cabin-grades', voyageId],
    queryFn: () => fetchCabinGrades(voyageId),
  })
  const grade = grades[0] ?? null

  const saveMut = useMutation({
    mutationFn: () => {
      if (!draft) return saveCabinGrades(voyageId, [], grades.map(g => g.id))
      const { _key, _isNew, _deleted, id, ...rest } = draft
      const toSave = [{ id: _isNew ? undefined : id, ...rest, grade: rest.grade || '기본' }]
      const deletedIds = grades.filter(g => g.id !== id).map(g => g.id)
      return saveCabinGrades(voyageId, toSave, deletedIds)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabin-grades', voyageId] })
      qc.invalidateQueries({ queryKey: ['voyages'] })
      qc.invalidateQueries({ queryKey: ['all-cabin-grades'] })
      setIsEditing(false)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  function startEdit() {
    setDraft(grade ? {
      _key: grade.id, _isNew: false, _deleted: false,
      id: grade.id, grade: grade.grade,
      total: grade.total, reserved: grade.reserved,
      price_per_person: grade.price_per_person,
      currency: grade.currency, sort_order: 0,
    } : {
      _key: 'new', _isNew: true, _deleted: false,
      id: '', grade: '', total: 0, reserved: 0,
      price_per_person: null, currency: 'KRW', sort_order: 0,
    })
    setIsEditing(true)
    saveMut.reset()
  }

  function setField(field: keyof DraftGrade, value: unknown) {
    setDraft(prev => prev ? { ...prev, [field]: value } : prev)
  }

  if (isLoading) return <div className="px-6 py-4 text-xs text-slate-400">불러오는 중…</div>

  return (
    <div className="bg-slate-50/70 border-t border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">선실 등급 현황</span>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
                className="flex items-center gap-1 text-xs text-green-700 hover:bg-green-100 rounded px-2 py-1 transition disabled:opacity-40">
                <Check className="h-3 w-3" />{saveMut.isPending ? '저장 중…' : '저장'}
              </button>
              <button onClick={() => setIsEditing(false)} disabled={saveMut.isPending}
                className="flex items-center gap-1 text-xs text-slate-400 hover:bg-slate-200 rounded px-2 py-1 transition">
                <X className="h-3 w-3" />취소
              </button>
            </>
          ) : canWrite && (
            <button onClick={startEdit} className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand transition">
              <Pencil className="h-3 w-3" />편집
            </button>
          )}
        </div>
      </div>

      {!isEditing && !grade ? (
        <p className="text-xs text-slate-400 py-2">
          등록된 등급이 없습니다.{canWrite && (
            <button onClick={startEdit} className="ml-2 text-brand hover:underline">추가하기</button>
          )}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[520px] w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-200">
                <th className="py-1.5 text-left font-medium w-28">등급</th>
                <th className="py-1.5 text-right font-medium w-14">보유</th>
                <th className="py-1.5 text-right font-medium w-14">예약</th>
                <th className="py-1.5 text-right font-medium w-14">잔여</th>
                <th className="py-1.5 text-right font-medium w-28">1인 요금</th>
                <th className="py-1.5 text-right font-medium w-16">통화</th>
              </tr>
            </thead>
            <tbody>
              {isEditing && draft ? (
                <tr>
                  <td className="py-1">
                    <SelectOrInput
                      value={draft.grade}
                      onChange={v => setField('grade', v)}
                      options={DEFAULT_GRADES}
                      placeholder="등급 선택…"
                    />
                  </td>
                  <td className="py-1 pr-1">
                    <input type="number" min={0} value={draft.total} onChange={e => setField('total', Number(e.target.value))}
                      className="input h-6 text-xs text-right w-full" />
                  </td>
                  <td className="py-1 pr-1">
                    <input type="number" min={0} value={draft.reserved} onChange={e => setField('reserved', Number(e.target.value))}
                      className="input h-6 text-xs text-right w-full" />
                  </td>
                  <td className="py-1 text-right text-slate-500">{draft.total - draft.reserved}</td>
                  <td className="py-1 pr-1">
                    <input type="number" min={0} value={draft.price_per_person ?? ''}
                      onChange={e => setField('price_per_person', e.target.value ? Number(e.target.value) : null)}
                      placeholder="—" className="input h-6 text-xs text-right w-full" />
                  </td>
                  <td className="py-1 pr-1">
                    <div className="relative">
                      <select value={draft.currency} onChange={e => setField('currency', e.target.value)}
                        className="select h-6 text-xs w-full appearance-none pr-5">
                        <option value="KRW">KRW</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                    </div>
                  </td>
                </tr>
              ) : grade && (
                <tr>
                  <td className="py-1.5 font-medium text-slate-700">{grade.grade}</td>
                  <td className="py-1.5 text-right text-slate-600">{grade.total}</td>
                  <td className="py-1.5 text-right text-slate-600">{grade.reserved}</td>
                  <td className="py-1.5 text-right">
                    <span className={grade.total - grade.reserved === 0 ? 'text-red-500 font-medium' : 'text-slate-600'}>
                      {grade.total - grade.reserved}
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-slate-600">{formatPrice(grade.price_per_person, grade.currency)}</td>
                  <td className="py-1.5 text-right text-slate-400">{grade.currency}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── 메인 CruiseTab ────────────────────────────────────────────────────────
export default function CruiseTab() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('ALL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CruiseForm>({
    cruise_line: '', ship_name: '', agent: '', cabin_total: '', cabin_remaining: '',
    cabin_grade: '', cabin_price: '', cabin_currency: 'KRW',
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const qc = useQueryClient()
  const { canWrite } = useAuth() as { canWrite: boolean }

  const { data: voyages = [], isLoading } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const { data: allGrades = [] } = useQuery({
    queryKey: ['all-cabin-grades'],
    queryFn: fetchAllCabinGrades,
  })

  const gradeMap = useMemo(() => {
    const map: Record<string, CabinGrade[]> = {}
    allGrades.forEach(g => {
      if (!map[g.voyage_id]) map[g.voyage_id] = []
      map[g.voyage_id].push(g)
    })
    return map
  }, [allGrades])

  const saveMut = useMutation({
    mutationFn: async (id: string) => {
      await updateVoyage(id, {
        cruise_line: editForm.cruise_line || null,
        ship_name: editForm.ship_name || null,
        agent: editForm.agent || null,
        cabin_total: Number(editForm.cabin_total) || 0,
        cabin_remaining: Number(editForm.cabin_remaining) || 0,
      })
      const existing = gradeMap[id]?.[0]
      const gradeToSave = editForm.cabin_grade || existing?.grade
      const priceToSave = editForm.cabin_price !== ''
        ? Number(editForm.cabin_price)
        : (existing?.price_per_person ?? null)
      if (gradeToSave || editForm.cabin_price !== '') {
        const finalGrade = gradeToSave || '기본'
        const currencyToSave = editForm.cabin_currency || existing?.currency || 'KRW'
        if (existing) {
          await saveCabinGrades(id, [{
            id: existing.id, grade: finalGrade,
            total: existing.total, reserved: existing.reserved,
            price_per_person: priceToSave,
            currency: currencyToSave, sort_order: 0,
          }], [])
        } else {
          await saveCabinGrades(id, [{
            grade: finalGrade, total: 0, reserved: 0,
            price_per_person: priceToSave,
            currency: currencyToSave, sort_order: 0,
          }], [])
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voyages'] })
      qc.invalidateQueries({ queryKey: ['all-cabin-grades'] })
      qc.invalidateQueries({ queryKey: ['cabin-grades'] })
      setEditingId(null)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  function startEdit(v: Voyage) {
    const g = gradeMap[v.id]?.[0]
    setEditForm({
      ...toForm(v),
      cabin_grade:    g?.grade    ?? '',
      cabin_price:    g?.price_per_person != null ? String(g.price_per_person) : '',
      cabin_currency: g?.currency ?? 'KRW',
    })
    setEditingId(v.id)
    saveMut.reset()
  }

  function set(field: keyof CruiseForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setEditForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function setField(field: keyof CruiseForm, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  const years = useMemo(() => {
    const ys = new Set<string>()
    voyages.forEach(v => { if (v.departure_date) ys.add(v.departure_date.slice(0, 4)) })
    return Array.from(ys).sort().reverse()
  }, [voyages])

  const filtered = voyages.filter(v => {
    if (yearFilter !== 'ALL' && !v.departure_date?.startsWith(yearFilter)) return false
    if (!filter) return true
    return (
      voyageTitle(v).toLowerCase().includes(filter.toLowerCase()) ||
      (v.cruise_line ?? '').toLowerCase().includes(filter.toLowerCase()) ||
      (v.ship_name ?? '').toLowerCase().includes(filter.toLowerCase()) ||
      (v.agent ?? '').toLowerCase().includes(filter.toLowerCase())
    )
  })
  const active    = filtered.filter(v => v.status !== '취소')
  const cancelled = filtered.filter(v => v.status === '취소')
  const ordered   = [...active, ...cancelled]

  // 선사 변경 시 선박명이 새 선사 목록에 없으면 초기화
  function handleCruiseLineChange(v: string) {
    const ships = CRUISE_LINES[v] ?? ALL_SHIPS
    const keepShip = ships.includes(editForm.ship_name)
    setEditForm(prev => ({
      ...prev,
      cruise_line: v,
      ship_name: keepShip ? prev.ship_name : '',
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">크루즈</h1>
          <p className="text-sm text-slate-400">캐빈 현황 · ▶ 클릭으로 등급별 현황 확인</p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect value={yearFilter} years={years} onChange={setYearFilter} />
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
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[920px] w-full text-xs table-fixed">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-2 py-2.5 w-8" />
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-32">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">승선일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">하선일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">선사</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">크루즈</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">에이전트</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16">캐빈등급</th>
              <th className="px-2 py-2.5 text-right font-semibold text-slate-500 w-14 whitespace-nowrap">보유캐빈</th>
              <th className="px-2 py-2.5 text-right font-semibold text-slate-500 w-14 whitespace-nowrap">예약캐빈</th>
              <th className="px-2 py-2.5 text-right font-semibold text-slate-500 w-14 whitespace-nowrap">잔여캐빈</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-24">캐빈가</th>
              <th className="px-3 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={13} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
            )}
            {!isLoading && ordered.length === 0 && (
              <tr><td colSpan={13} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
            )}
            {ordered.map(v => {
              const primaryGrade = gradeMap[v.id]?.[0] ?? null
              const reserved   = primaryGrade ? primaryGrade.reserved : (v.cabin_total - v.cabin_remaining)
              const remaining  = primaryGrade ? (primaryGrade.total - primaryGrade.reserved) : v.cabin_remaining
              const total      = primaryGrade ? primaryGrade.total : v.cabin_total
              const isCancelled = v.status === '취소'
              const isEdit     = editingId === v.id
              const isExpanded = expandedId === v.id

              return (
                <Fragment key={v.id}>
                  <tr
                    className={[
                      'border-b border-slate-100 hover:bg-slate-50 transition-colors',
                      isCancelled ? 'opacity-50' : '',
                      isExpanded ? 'bg-slate-50' : '',
                    ].join(' ')}
                  >
                    {/* 펼치기 버튼 */}
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => toggleExpand(v.id)}
                        className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-100 transition"
                        title="등급별 현황">
                        {isExpanded
                          ? <ChevronDown className="h-3.5 w-3.5" />
                          : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isCancelled ? (
                        <span className="line-through text-slate-400">{voyageTitle(v)}</span>
                      ) : (
                        <button
                          onClick={() => navigate(`/voyages?tab=항차검색&voyage=${v.id}`)}
                          className="group flex items-center gap-1 font-medium text-slate-800 hover:text-brand transition"
                          title="항차 검색에서 보기"
                        >
                          {voyageTitle(v)}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(v.departure_date)}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{v.return_date ? formatDate(v.return_date) : '—'}</td>
                    <td className="px-3 py-2 text-slate-600 truncate">{v.cruise_line ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600 truncate">{v.ship_name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600 truncate">{v.agent ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{primaryGrade?.grade ?? '—'}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{total || '—'}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{primaryGrade ? reserved : (v.cabin_total - v.cabin_remaining) || '—'}</td>
                    <td className="px-2 py-2 text-right">
                      <span className={remaining === 0 ? 'text-red-500 font-medium' : 'text-slate-700'}>
                        {remaining}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {primaryGrade ? formatPrice(primaryGrade.price_per_person, primaryGrade.currency) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!isEdit && canWrite && (
                        <button onClick={() => startEdit(v)}
                          className="rounded p-1 text-slate-400 hover:text-brand hover:bg-slate-100 transition"
                          title="편집">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* 인라인 편집 행 */}
                  {isEdit && (
                    <tr className="border-b border-slate-100">
                      <td colSpan={13} className="px-3 py-3 bg-brand/5 border-t border-brand/10">
                        {saveMut.isError && (
                          <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8 mb-2">
                          <div>
                            <label className="label">선사</label>
                            <SelectOrInput
                              key={`${editingId}-cl`}
                              value={editForm.cruise_line}
                              onChange={handleCruiseLineChange}
                              options={Object.keys(CRUISE_LINES)}
                              placeholder="선사 선택…"
                            />
                          </div>
                          <div>
                            <label className="label">크루즈 선박명</label>
                            <SelectOrInput
                              key={`${editingId}-sn`}
                              value={editForm.ship_name}
                              onChange={v => setField('ship_name', v)}
                              options={editForm.cruise_line && CRUISE_LINES[editForm.cruise_line]
                                ? CRUISE_LINES[editForm.cruise_line]
                                : ALL_SHIPS}
                              placeholder="선박명 선택…"
                            />
                          </div>
                          <div>
                            <label className="label">에이전트</label>
                            <Input value={editForm.agent} onChange={set('agent')} placeholder="현지 파트너" className="h-7 text-sm" />
                          </div>
                          <div>
                            <label className="label">캐빈등급</label>
                            <SelectOrInput
                              key={`${editingId}-cg`}
                              value={editForm.cabin_grade}
                              onChange={v => setField('cabin_grade', v)}
                              options={CABIN_GRADES}
                              placeholder="등급 선택…"
                            />
                          </div>
                          <div>
                            <label className="label">보유 캐빈</label>
                            <Input type="number" min={0} value={editForm.cabin_total} onChange={set('cabin_total')} className="h-7 text-sm" />
                          </div>
                          <div>
                            <label className="label">잔여 캐빈</label>
                            <Input type="number" min={0} value={editForm.cabin_remaining} onChange={set('cabin_remaining')} className="h-7 text-sm" />
                          </div>
                          <div>
                            <label className="label">캐빈가 (1인)</label>
                            <Input
                              type="number"
                              min={0}
                              value={editForm.cabin_price}
                              onChange={set('cabin_price')}
                              placeholder="가격 입력"
                              className="h-7 text-sm"
                            />
                          </div>
                          <div>
                            <label className="label">통화</label>
                            <FieldSelect
                              value={editForm.cabin_currency}
                              options={['KRW', 'USD', 'EUR']}
                              onChange={v => setField('cabin_currency', v)}
                              className="h-7 text-sm px-2"
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

                  {/* 등급별 현황 패널 */}
                  {isExpanded && !isEdit && (
                    <tr className="border-b border-slate-200">
                      <td colSpan={13} className="p-0">
                        <GradesPanel voyageId={v.id} canWrite={canWrite} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
