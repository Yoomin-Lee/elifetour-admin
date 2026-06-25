import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Check, X, FileText, ChevronDown, Settings } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { saveCancellationPolicy, deleteCancellationPolicy } from '@/lib/queries/voyages'
import { fetchCancellationPresets } from '@/lib/queries/cancellationPresets'
import type { CancellationPresetDB } from '@/lib/queries/cancellationPresets'
import { fetchMnSections } from '@/lib/queries/mnSections'
import type { MnSection } from '@/lib/queries/mnSections'
import CancellationPresetManager from './CancellationPresetManager'
import type { CancellationPolicy } from '@/types/database'

const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY']

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
  const [presetOpen, setPresetOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [pendingPreset, setPendingPreset] = useState<CancellationPresetDB | null>(null)
  const [pendingMn, setPendingMn] = useState<MnSection | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const presetBtnRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: presets = [] } = useQuery({
    queryKey: ['cancellation-presets'],
    queryFn: fetchCancellationPresets,
  })

  const { data: mnSections = [] } = useQuery({
    queryKey: ['mn-sections'],
    queryFn: fetchMnSections,
    select: (data) => data.filter(s => s.category === '취소료'),
  })

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

  function presetPolicyToDraft(p: CancellationPolicy, i: number): DraftPolicy {
    return {
      _key: `preset-${i}-${Date.now()}`,
      _isNew: true, _deleted: false, id: '',
      category: p.category ?? '',
      start_d_minus: p.start_d_minus != null ? String(p.start_d_minus) : '',
      end_d_minus: p.end_d_minus != null ? String(p.end_d_minus) : '',
      reference_date: p.reference_date ?? '',
      fee_description: p.fee_description ?? '',
      fee_unit: p.fee_unit ?? '',
      note: p.note ?? '',
      sort_order: i,
    }
  }

  function mnSectionToDrafts(section: MnSection): DraftPolicy[] {
    return section.rows
      .filter(r => r.d || r.fee)
      .map((r, i) => ({
        _key: `mn-${i}-${Date.now()}`,
        _isNew: true, _deleted: false, id: '',
        category: '크루즈',
        fee_description: r.d ?? '',
        note: [r.fee, r.note].filter(Boolean).join(' | '),
        start_d_minus: '', end_d_minus: '',
        reference_date: '', fee_unit: '',
        sort_order: i,
      }))
  }

  function applyPreset(preset: CancellationPresetDB, mode: 'replace' | 'append') {
    const rows = preset.policies.map(presetPolicyToDraft)
    setDraft(d => mode === 'replace' ? rows : [...d, ...rows])
    setImportMsg(`${preset.label} — ${preset.policies.length}개 구간 불러옴`)
    setTimeout(() => setImportMsg(null), 4000)
    setPendingPreset(null)
    setPresetOpen(false)
  }

  function applyMnSection(section: MnSection, mode: 'replace' | 'append') {
    const rows = mnSectionToDrafts(section)
    setDraft(d => mode === 'replace' ? rows : [...d, ...rows])
    setImportMsg(`${section.title} — ${rows.length}개 구간 불러옴`)
    setTimeout(() => setImportMsg(null), 4000)
    setPendingMn(null)
    setPresetOpen(false)
  }

  function handlePresetSelect(preset: CancellationPresetDB) {
    if (visible.length > 0) { setPendingPreset(preset); setPresetOpen(false) }
    else applyPreset(preset, 'replace')
  }

  function handleMnSelect(section: MnSection) {
    if (visible.length > 0) { setPendingMn(section); setPresetOpen(false) }
    else applyMnSection(section, 'replace')
  }

  const visible = draft.filter(r => !r._deleted)

  if (editing) {
    return (
      <>
      <Card>
        <CardHeader>
          <CardTitle>취소료</CardTitle>
          <div className="flex flex-wrap items-center gap-1">
            {importMsg && <span className="text-xs text-brand font-medium">{importMsg}</span>}

            {/* 불러오기 드롭다운 */}
            <div className="relative" ref={presetBtnRef}>
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => {
                  if (!presetOpen && presetBtnRef.current) {
                    const rect = presetBtnRef.current.getBoundingClientRect()
                    setDropUp(window.innerHeight - rect.bottom < 280)
                  }
                  setPresetOpen(v => !v)
                }}
                disabled={saveMut.isPending}
                className="gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                불러오기
                <ChevronDown className={`h-3 w-3 transition-transform ${presetOpen ? 'rotate-180' : ''}`} />
              </Button>
              {presetOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPresetOpen(false)} />
                  <div className={`absolute right-0 z-20 w-64 rounded-lg border border-slate-200 bg-white shadow-lg py-1 overflow-hidden flex flex-col ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                    <div className="overflow-y-auto max-h-64">
                      {mnSections.length > 0 && (
                        <>
                          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">취소료 규정</p>
                          {mnSections.map(s => (
                            <button key={s.id} type="button" onClick={() => handleMnSelect(s)}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-brand/5 transition">
                              <span className="font-medium text-slate-700">{s.title}</span>
                              <span className="ml-1.5 text-slate-400">{s.rows.length}구간</span>
                            </button>
                          ))}
                        </>
                      )}
                      {presets.length > 0 && (
                        <>
                          {mnSections.length > 0 && <div className="my-1 border-t border-slate-100" />}
                          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">저장된 프리셋</p>
                          {presets.map(p => (
                            <button key={p.id} type="button" onClick={() => handlePresetSelect(p)}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 transition">
                              <span className="font-medium text-slate-700">{p.label}</span>
                              <span className="ml-1.5 text-slate-400">{p.policies.length}구간</span>
                            </button>
                          ))}
                        </>
                      )}
                      {mnSections.length === 0 && presets.length === 0 && (
                        <p className="px-3 py-2 text-xs text-slate-400">등록된 취소료가 없습니다</p>
                      )}
                    </div>
                    <div className="border-t border-slate-100 shrink-0">
                      <button type="button" onClick={() => { setPresetOpen(false); setManagerOpen(true) }}
                        className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 transition">
                        <Settings className="h-3 w-3" /> 취소료 관리
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

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

          {/* 프리셋 교체 확인 */}
          {(pendingPreset || pendingMn) && (
            <div className="mb-3 rounded-lg border border-brand/20 bg-brand/5 p-3 text-xs">
              <p className="font-medium text-slate-700 mb-2">
                「{pendingPreset?.label ?? pendingMn?.title}」을 불러올까요?
              </p>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => pendingPreset ? applyPreset(pendingPreset, 'replace') : applyMnSection(pendingMn!, 'replace')}
                  className="rounded px-2 py-1 bg-brand text-white hover:bg-brand/90 transition">
                  기존 내용 교체
                </button>
                <button type="button"
                  onClick={() => pendingPreset ? applyPreset(pendingPreset, 'append') : applyMnSection(pendingMn!, 'append')}
                  className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
                  아래에 추가
                </button>
                <button type="button"
                  onClick={() => { setPendingPreset(null); setPendingMn(null) }}
                  className="rounded px-2 py-1 text-slate-400 hover:bg-slate-100 transition">
                  취소
                </button>
              </div>
            </div>
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

      {managerOpen && <CancellationPresetManager onClose={() => setManagerOpen(false)} />}
    </>
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
                <TableHead className="whitespace-nowrap">기간</TableHead>
                <TableHead className="whitespace-nowrap">날짜</TableHead>
                <TableHead>취소료</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map(p => {
                const d = dMinusForPolicy(p, departureDate, boardingDate ?? null)
                const current = isCurrent(p, d)
                const refDate = p.reference_date
                  ? p.reference_date
                  : isCruiseCat(p.category) && boardingDate
                    ? boardingDate
                    : departureDate
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
                    <TableCell className="whitespace-nowrap text-slate-500 text-xs">
                      {refDate}
                      {p.reference_date && <span className="ml-1 text-brand text-[10px]">지정</span>}
                    </TableCell>
                    <TableCell className={cn(current && 'text-amber-700')}>
                      {p.fee_description ?? '-'}
                    </TableCell>
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
