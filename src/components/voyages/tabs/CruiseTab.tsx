import { useState, useMemo, Fragment, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { YearSelect } from '@/components/ui/year-select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Pencil, Check, X, ChevronDown, ChevronRight, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { fetchVoyages, updateVoyage, fetchCabinGrades, saveCabinGrades, fetchAllCabinGrades } from '@/lib/queries/voyages'
import { CruiseLineBadge } from '@/components/ui/cruise-line-badge'
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
const AGENTS = ['TMK', 'COSTA', 'ONLINE', 'DONGBO', 'VASCO', 'FLORENCE']

// ── SelectOrInput — FieldSelect 기반 (직접 입력 지원) ──────────────────────
const CUSTOM = '__CUSTOM__'

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
  const [isCustom, setIsCustom] = useState(false)

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
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 transition"
          title="목록으로"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // 기존 DB 값이 목록에 없으면 동적으로 추가
  const baseOptions = value !== '' && !options.includes(value)
    ? [value, ...options]
    : options

  const fieldOptions = [
    ...baseOptions,
    { value: CUSTOM, label: '✏ 직접 입력' },
  ]

  return (
    <FieldSelect
      value={value}
      options={fieldOptions}
      onChange={v => {
        if (v === CUSTOM) { setIsCustom(true); onChange('') }
        else onChange(v)
      }}
      placeholder={placeholder}
      className="h-7 text-sm"
    />
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
  cabin_ccf: string
  cabin_nccf: string
  cabin_tax: string
  cabin_tip: string
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
    cabin_ccf: '',
    cabin_nccf: '',
    cabin_tax: '',
    cabin_tip: '',
    cabin_currency: 'KRW',
  }
}

// ── 등급 드래프트 ─────────────────────────────────────────────────────────
type DraftGrade = {
  _key: string; _isNew: boolean; _deleted: boolean
  id: string; grade: string; total: number; reserved: number
  price_per_person: number | null
  ccf: number | null; nccf: number | null; tax: number | null; tip: number | null
  currency: string; sort_order: number
}

function calcTotal(g: { ccf: number | null; nccf: number | null; tax: number | null; tip: number | null; price_per_person: number | null }): number | null {
  const sum = (g.ccf ?? 0) + (g.nccf ?? 0) + (g.tax ?? 0) + (g.tip ?? 0)
  if (sum > 0) return sum
  return g.price_per_person
}
const DEFAULT_GRADES = ['4D', '2D', 'BA2', 'BR1', '3D(FIT)', '4U', 'BM1', 'VD', '1D', '3D', 'VC', 'VE']

function formatPrice(price: number | null, currency: string): string {
  if (price == null) return '—'
  const sym: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥' }
  const prefix = sym[currency] ?? (currency + ' ')
  return prefix + price.toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
}

// ── 등급 현황 서브 패널 ───────────────────────────────────────────────────
function GradesPanel({ voyageId, canWrite }: { voyageId: string; canWrite: boolean }) {
  const qc = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [drafts, setDrafts] = useState<DraftGrade[]>([])
  const keyRef = useRef(0)

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['cabin-grades', voyageId],
    queryFn: () => fetchCabinGrades(voyageId),
  })

  const saveMut = useMutation({
    mutationFn: () => {
      const active = drafts.filter(d => !d._deleted)
      const toSave = active.map(({ _key, _isNew, _deleted, id, ...rest }, idx) => ({
        ...(!_isNew ? { id } : {}),
        ...rest,
        grade: rest.grade || '기본',
        price_per_person: calcTotal(rest),
        sort_order: idx,
      }))
      const deletedIds = drafts.filter(d => d._deleted && !d._isNew).map(d => d.id)
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

  function makeDraft(): DraftGrade {
    keyRef.current += 1
    return {
      _key: `new-${keyRef.current}`, _isNew: true, _deleted: false,
      id: '', grade: '', total: 0, reserved: 0,
      price_per_person: null, ccf: null, nccf: null, tax: null, tip: null,
      currency: 'USD', sort_order: 0,
    }
  }

  function startEdit() {
    setDrafts(grades.length > 0
      ? grades.map(g => ({
          _key: g.id, _isNew: false, _deleted: false,
          id: g.id, grade: g.grade,
          total: g.total, reserved: g.reserved,
          price_per_person: null,
          ccf: g.ccf ?? null, nccf: g.nccf ?? null,
          tax: g.tax ?? null, tip: g.tip ?? null,
          currency: g.currency, sort_order: g.sort_order,
        }))
      : [makeDraft()]
    )
    setIsEditing(true)
    saveMut.reset()
  }

  function addDraft() {
    setDrafts(prev => [...prev, makeDraft()])
  }

  function removeDraft(key: string, isNew: boolean) {
    if (isNew) {
      setDrafts(prev => prev.filter(d => d._key !== key))
    } else {
      setDrafts(prev => prev.map(d => d._key === key ? { ...d, _deleted: true } : d))
    }
  }

  function updateDraft(key: string, field: keyof DraftGrade, value: unknown) {
    setDrafts(prev => prev.map(d => d._key === key ? { ...d, [field]: value } : d))
  }

  if (isLoading) return <div className="px-6 py-4 text-xs text-slate-400">불러오는 중…</div>

  const visibleDrafts = drafts.filter(d => !d._deleted)

  return (
    <div className="bg-slate-50/70 border-t border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">선실 등급 현황</span>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={addDraft}
                className="flex items-center gap-1 text-xs text-brand hover:bg-brand/10 rounded px-2 py-1 transition">
                <Plus className="h-3 w-3" />등급 추가
              </button>
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

      {/* 조회 모드 */}
      {!isEditing && grades.length === 0 && (
        <p className="text-xs text-slate-400 py-2">
          등록된 등급이 없습니다.{canWrite && (
            <button onClick={startEdit} className="ml-2 text-brand hover:underline">추가하기</button>
          )}
        </p>
      )}
      {!isEditing && grades.length > 0 && (
        <div className="divide-y divide-slate-100">
          {grades.map(g => (
            <div key={g.id} className="py-2 first:pt-0 last:pb-0">
              <div className="flex gap-5 text-xs mb-1">
                <span className="font-semibold text-slate-700 w-12">{g.grade}</span>
                <span className="text-slate-400">보유 <span className="font-semibold text-slate-700">{g.total}</span></span>
                <span className="text-slate-400">예약 <span className="font-semibold text-slate-700">{g.reserved}</span></span>
                <span className="text-slate-400">잔여 <span className={`font-semibold ${g.total - g.reserved === 0 ? 'text-red-500' : 'text-slate-700'}`}>{g.total - g.reserved}</span></span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(['ccf', 'nccf', 'tax', 'tip'] as const).map((f, idx) => (
                  <Fragment key={f}>
                    <span className="text-slate-400">{f.toUpperCase()} <span className="text-slate-700 font-medium">{formatPrice(g[f], g.currency)}</span></span>
                    {idx < 3 && <span className="text-slate-300">+</span>}
                  </Fragment>
                ))}
                <span className="text-slate-300">=</span>
                <span className="font-semibold text-brand">{formatPrice(calcTotal(g), g.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 편집 모드 */}
      {isEditing && (
        <div className="space-y-2">
          {visibleDrafts.map(d => (
            <div key={d._key} className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-2">
              {/* 편집 1행: 등급 + 수량 + 삭제 */}
              <div className="flex flex-wrap gap-2 items-end">
                <div className="w-28">
                  <p className="text-[10px] text-slate-400 mb-0.5">등급</p>
                  <SelectOrInput value={d.grade} onChange={v => updateDraft(d._key, 'grade', v)} options={DEFAULT_GRADES} placeholder="등급…" />
                </div>
                {(['total', 'reserved'] as const).map(f => (
                  <div key={f} className="w-16">
                    <p className="text-[10px] text-slate-400 mb-0.5">{f === 'total' ? '보유' : '예약'}</p>
                    <input type="number" min={0} value={d[f]}
                      onChange={e => updateDraft(d._key, f, Number(e.target.value))}
                      className="input h-7 text-xs text-right w-full" />
                  </div>
                ))}
                <div className="w-12">
                  <p className="text-[10px] text-slate-400 mb-0.5">잔여</p>
                  <div className="h-7 flex items-center justify-end pr-1 text-xs text-slate-500">{d.total - d.reserved}</div>
                </div>
                <div className="flex-1" />
                <button
                  onClick={() => removeDraft(d._key, d._isNew)}
                  className="h-7 w-7 flex items-center justify-center rounded text-slate-300 hover:text-red-400 hover:bg-red-50 transition"
                  title="등급 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* 편집 2행: CCF/NCCF/TAX/TIP 계산식 */}
              <div className="flex flex-wrap gap-2 items-end border-t border-slate-100 pt-2">
                {(['ccf', 'nccf', 'tax', 'tip'] as const).map((f, fidx) => (
                  <Fragment key={f}>
                    <div className="w-20">
                      <p className="text-[10px] text-slate-400 mb-0.5">{f.toUpperCase()}</p>
                      <input type="number" min={0} value={d[f] ?? ''}
                        onChange={e => updateDraft(d._key, f, e.target.value ? Number(e.target.value) : null)}
                        placeholder="—" className="input h-7 text-xs text-right w-full" />
                    </div>
                    {fidx < 3 && <span className="text-slate-400 text-sm pb-1">+</span>}
                  </Fragment>
                ))}
                <span className="text-slate-400 text-sm pb-1">=</span>
                <div className="w-24">
                  <p className="text-[10px] text-brand mb-0.5">캐빈가 총합</p>
                  <div className="h-7 flex items-center justify-end pr-2 text-xs font-semibold text-brand">
                    {formatPrice(calcTotal(d), d.currency)}
                  </div>
                </div>
                <div className="w-20">
                  <p className="text-[10px] text-slate-400 mb-0.5">통화</p>
                  <FieldSelect value={d.currency} options={['KRW', 'USD', 'EUR', 'SGD', 'JPY']}
                    onChange={v => updateDraft(d._key, 'currency', v)} className="h-7 text-xs" />
                </div>
              </div>
            </div>
          ))}
          {visibleDrafts.length === 0 && (
            <p className="text-xs text-slate-400 py-1">등급이 없습니다. 위에서 '등급 추가'를 눌러주세요.</p>
          )}
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
    cabin_grade: '', cabin_price: '', cabin_ccf: '', cabin_nccf: '', cabin_tax: '', cabin_tip: '', cabin_currency: 'KRW',
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
      const ccf  = editForm.cabin_ccf  !== '' ? Number(editForm.cabin_ccf)  : (existing?.ccf  ?? null)
      const nccf = editForm.cabin_nccf !== '' ? Number(editForm.cabin_nccf) : (existing?.nccf ?? null)
      const tax  = editForm.cabin_tax  !== '' ? Number(editForm.cabin_tax)  : (existing?.tax  ?? null)
      const tip  = editForm.cabin_tip  !== '' ? Number(editForm.cabin_tip)  : (existing?.tip  ?? null)
      const total = calcTotal({ ccf, nccf, tax, tip, price_per_person: existing?.price_per_person ?? null })
      const hasCabinData = gradeToSave || editForm.cabin_ccf !== '' || editForm.cabin_nccf !== '' || editForm.cabin_tax !== '' || editForm.cabin_tip !== ''
      if (hasCabinData) {
        const finalGrade = gradeToSave || '기본'
        const currencyToSave = editForm.cabin_currency || existing?.currency || 'KRW'
        if (existing) {
          await saveCabinGrades(id, [{
            id: existing.id, grade: finalGrade,
            total: existing.total, reserved: existing.reserved,
            price_per_person: total, ccf, nccf, tax, tip,
            currency: currencyToSave, sort_order: 0,
          }], [])
        } else {
          await saveCabinGrades(id, [{
            grade: finalGrade, total: 0, reserved: 0,
            price_per_person: total, ccf, nccf, tax, tip,
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
      cabin_ccf:      g?.ccf  != null ? String(g.ccf)  : '',
      cabin_nccf:     g?.nccf != null ? String(g.nccf) : '',
      cabin_tax:      g?.tax  != null ? String(g.tax)  : '',
      cabin_tip:      g?.tip  != null ? String(g.tip)  : '',
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
              const voyageGrades = gradeMap[v.id] ?? []
              const primaryGrade = voyageGrades[0] ?? null
              const totalCabin    = voyageGrades.length > 0 ? voyageGrades.reduce((s, g) => s + g.total, 0) : v.cabin_total
              const reservedCabin = voyageGrades.length > 0 ? voyageGrades.reduce((s, g) => s + g.reserved, 0) : (v.cabin_total - v.cabin_remaining)
              const remainingCabin = voyageGrades.length > 0 ? voyageGrades.reduce((s, g) => s + (g.total - g.reserved), 0) : v.cabin_remaining
              const gradeLabel = voyageGrades.length === 0 ? '—'
                : voyageGrades.length === 1 ? voyageGrades[0].grade
                : `${voyageGrades[0].grade} 외 ${voyageGrades.length - 1}`
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
                          title="항차 상세에서 보기"
                        >
                          {voyageTitle(v)}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(v.boarding_date ?? v.departure_date)}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{v.return_date ? formatDate(v.return_date) : '—'}</td>
                    <td className="px-3 py-2"><CruiseLineBadge value={v.cruise_line} /></td>
                    <td className="px-3 py-2 text-slate-600 truncate">{v.ship_name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600 truncate">{v.agent ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{gradeLabel}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{totalCabin || '—'}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{reservedCabin || '—'}</td>
                    <td className="px-2 py-2 text-right">
                      <span className={remainingCabin === 0 ? 'text-red-500 font-medium' : 'text-slate-700'}>
                        {remainingCabin}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {primaryGrade ? formatPrice(calcTotal(primaryGrade), primaryGrade.currency) : '—'}
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
                        <div className="flex flex-wrap gap-x-3 gap-y-2 mb-2">
                          <div className="w-36">
                            <label className="label">선사</label>
                            <SelectOrInput
                              key={`${editingId}-cl`}
                              value={editForm.cruise_line}
                              onChange={handleCruiseLineChange}
                              options={Object.keys(CRUISE_LINES)}
                              placeholder="선사 선택…"
                            />
                          </div>
                          <div className="w-52">
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
                          <div className="w-28">
                            <label className="label">에이전트</label>
                            <SelectOrInput
                              key={`${editingId}-ag`}
                              value={editForm.agent}
                              onChange={v => setField('agent', v)}
                              options={AGENTS}
                              placeholder="에이전트…"
                            />
                          </div>
                          <div className="w-24">
                            <label className="label">캐빈등급</label>
                            <SelectOrInput
                              key={`${editingId}-cg`}
                              value={editForm.cabin_grade}
                              onChange={v => setField('cabin_grade', v)}
                              options={CABIN_GRADES}
                              placeholder="등급…"
                            />
                          </div>
                          <div className="w-20">
                            <label className="label">보유 캐빈</label>
                            <Input type="number" min={0} value={editForm.cabin_total} onChange={set('cabin_total')} className="h-7 text-sm" />
                          </div>
                          <div className="w-20">
                            <label className="label">잔여 캐빈</label>
                            <Input type="number" min={0} value={editForm.cabin_remaining} onChange={set('cabin_remaining')} className="h-7 text-sm" />
                          </div>
                          {(['ccf', 'nccf', 'tax', 'tip'] as const).map(f => (
                            <div key={f} className="w-20">
                              <label className="label">{f.toUpperCase()}</label>
                              <Input
                                type="number" min={0}
                                value={editForm[`cabin_${f}` as keyof CruiseForm] ?? ''}
                                onChange={e => setEditForm(prev => ({ ...prev, [`cabin_${f}`]: e.target.value }))}
                                placeholder="—"
                                className="h-7 text-sm"
                              />
                            </div>
                          ))}
                          <div className="w-20">
                            <label className="label">통화</label>
                            <FieldSelect
                              value={editForm.cabin_currency}
                              options={['KRW', 'USD', 'EUR', 'SGD', 'JPY']}
                              onChange={v => setField('cabin_currency', v)}
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
