import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Check, X, MapPin, ChevronDown, Settings } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { TimePicker } from '@/components/ui/time-picker'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { SelectOrInput } from '@/components/ui/select-or-input'
import { FieldSelect } from '@/components/ui/field-select'
import { formatDate, formatTime } from '@/lib/utils'
import { useClickOutside } from '@/hooks/useClickOutside'
import { saveItineraryDay, deleteItineraryDay } from '@/lib/queries/voyages'
import { fetchItineraryPresets } from '@/lib/queries/itineraryPresets'
import type { ItineraryPreset } from '@/lib/queries/itineraryPresets'
import ItineraryPresetManager from './ItineraryPresetManager'
import type { ItineraryDay } from '@/types/database'

const ITINERARY_CATEGORIES = ['랜드', '쇼렉스', '자유']

const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥',
}
function currencySymbol(code: string): string {
  return CURRENCY_SYMBOL[code] ?? code
}

const CURRENCY_OPTIONS = [
  { value: 'KRW', label: 'KRW' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'SGD', label: 'SGD' },
  { value: 'JPY', label: 'JPY' },
]

const SEA_DAY = '해상'

type DraftDay = {
  _key: string
  _isNew: boolean
  _deleted: boolean
  id: string
  date: string
  port: string
  arrival_time: string
  departure_time: string
  summary: string
  category: string
  cost: string
  cost_currency: string
  sort_order: number
}

function toDraft(d: ItineraryDay): DraftDay {
  return {
    _key: d.id, _isNew: false, _deleted: false, id: d.id,
    date: d.date, port: d.port,
    arrival_time: d.arrival_time ?? '', departure_time: d.departure_time ?? '',
    summary: d.summary ?? '', category: d.category ?? '',
    cost: d.cost != null ? String(d.cost) : '',
    cost_currency: d.cost_currency ?? 'USD',
    sort_order: d.sort_order,
  }
}

const EMPTY: Omit<DraftDay, '_key'> = {
  _isNew: true, _deleted: false, id: '',
  date: '', port: '', arrival_time: '', departure_time: '',
  summary: '', category: '', cost: '', cost_currency: 'USD', sort_order: 0,
}

function toInput(r: DraftDay, idx: number) {
  return {
    date: r.date,
    port: r.port,
    arrival_time: r.arrival_time || null,
    departure_time: r.departure_time || null,
    summary: r.summary || null,
    category: r.category || null,
    cost: r.cost ? Number(r.cost) : null,
    cost_currency: r.cost_currency || null,
    sort_order: r.sort_order || idx + 1,
  }
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

let _keySeq = 1
function newKey() { return `new-${_keySeq++}` }

export default function ItineraryCard({
  days,
  voyageId,
  canWrite = true,
  departureDate,
}: {
  days: ItineraryDay[]
  voyageId: string
  canWrite?: boolean
  departureDate?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DraftDay[]>([])
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [presetOpen, setPresetOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [pendingPreset, setPendingPreset] = useState<ItineraryPreset | null>(null)
  const presetBtnRef = useRef<HTMLDivElement>(null)
  useClickOutside(presetBtnRef, presetOpen, () => setPresetOpen(false))
  const qc = useQueryClient()

  const { data: presets = [] } = useQuery({
    queryKey: ['itinerary-presets'],
    queryFn: fetchItineraryPresets,
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      let idx = 0
      await Promise.all(draft.map(r => {
        if (r._deleted && !r._isNew) return deleteItineraryDay(r.id)
        if (r._isNew && !r._deleted) return saveItineraryDay(voyageId, toInput(r, idx++))
        if (!r._isNew && !r._deleted) return saveItineraryDay(voyageId, toInput(r, idx++), r.id)
        return Promise.resolve()
      }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['itinerary', voyageId] })
      setEditing(false)
      setDraft([])
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  function startEdit() {
    setDraft(days.map(toDraft))
    setEditing(true)
  }

  function addRow() {
    setDraft(d => [...d, { ...EMPTY, _key: newKey() }])
  }

  function removeRow(key: string) {
    setDraft(d =>
      d.map(r => r._key === key
        ? (r._isNew ? null : { ...r, _deleted: true })
        : r
      ).filter((r): r is DraftDay => r !== null)
    )
  }

  function upd(key: string, field: keyof DraftDay, value: string) {
    setDraft(d => d.map(r => r._key === key ? { ...r, [field]: value } : r))
  }

  function applyPreset(preset: ItineraryPreset, mode: 'replace' | 'append') {
    setDraft(prev => {
      const visibleCount = prev.filter(r => !r._deleted).length
      const baseOffset = mode === 'append' ? visibleCount : 0
      const newRows: DraftDay[] = preset.ports.map((p, i) => ({
        _key: newKey(),
        _isNew: true, _deleted: false, id: '',
        date: departureDate ? addDays(departureDate, baseOffset + i) : '',
        port: p.port,
        arrival_time: p.arrival_time,
        departure_time: p.departure_time,
        summary: p.summary,
        category: '',
        cost: '',
        cost_currency: 'USD',
        sort_order: baseOffset + i + 1,
      }))

      if (mode === 'replace') {
        const markedDeleted = prev
          .map(r => r._isNew ? null : { ...r, _deleted: true })
          .filter((r): r is DraftDay => r !== null)
        return [...markedDeleted, ...newRows]
      }
      return [...prev, ...newRows]
    })

    setImportMsg(`${preset.label} — ${preset.ports.length}개 기항지 불러옴`)
    setTimeout(() => setImportMsg(null), 4000)
    setPendingPreset(null)
    setPresetOpen(false)
  }

  function handlePresetSelect(preset: ItineraryPreset) {
    const visibleCount = draft.filter(r => !r._deleted).length
    if (visibleCount > 0) {
      setPendingPreset(preset)
    } else {
      applyPreset(preset, 'replace')
    }
    setPresetOpen(false)
  }

  const visible = draft.filter(r => !r._deleted)

  // ── 편집 모드 ────────────────────────────────────────────────────────────

  if (editing) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>기항지 일정</CardTitle>
              {importMsg && (
                <span className="text-xs text-brand font-medium">{importMsg}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {/* 루트 불러오기 */}
              <div className="relative" ref={presetBtnRef}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saveMut.isPending}
                  onClick={() => {
                    if (!presetOpen && presetBtnRef.current) {
                      const rect = presetBtnRef.current.getBoundingClientRect()
                      setDropUp(window.innerHeight - rect.bottom < 280)
                    }
                    setPresetOpen(v => !v)
                  }}
                  className="gap-1"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  루트 불러오기
                  <ChevronDown className={`h-3 w-3 transition-transform ${presetOpen ? 'rotate-180' : ''}`} />
                </Button>
                {presetOpen && (
                    <div className={`absolute right-0 z-20 w-64 rounded-lg border border-slate-200 bg-white shadow-lg py-1 overflow-hidden flex flex-col ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                      <div className="overflow-y-auto max-h-56">
                        {presets.length === 0 && (
                          <p className="px-3 py-2 text-xs text-slate-400">등록된 루트가 없습니다</p>
                        )}
                        {presets.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handlePresetSelect(p)}
                            className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 transition"
                          >
                            <span className="font-medium text-slate-700">{p.label}</span>
                            {p.nights && (
                              <span className="ml-1.5 text-slate-400">{p.nights}박</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 shrink-0">
                        <button
                          type="button"
                          onClick={() => { setPresetOpen(false); setManagerOpen(true) }}
                          className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 transition"
                        >
                          <Settings className="h-3 w-3" /> 루트 관리
                        </button>
                      </div>
                    </div>
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
                onClick={() => { setEditing(false); setDraft([]); setPendingPreset(null) }}
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

            {/* 루트 충돌 다이얼로그 */}
            {pendingPreset && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  이미 입력된 기항지가 있습니다. 어떻게 처리할까요?
                </p>
                <p className="text-xs text-amber-600 mb-3">
                  선택한 루트: <span className="font-semibold">{pendingPreset.label}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset(pendingPreset, 'replace')}
                    className="rounded px-3 py-1.5 text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition"
                  >
                    기존 삭제 후 불러오기
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(pendingPreset, 'append')}
                    className="rounded px-3 py-1.5 text-xs font-medium border border-amber-300 text-amber-700 hover:bg-amber-100 transition"
                  >
                    기존 유지하고 추가
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingPreset(null)}
                    className="rounded px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {visible.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">루트를 불러오거나 행 추가를 눌러 기항지를 등록하세요</p>
              ) : (
                visible.map((r, i) => (
                  <div key={r._key} className="relative flex gap-2 items-start rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <span className="mt-2 w-5 shrink-0 text-center text-xs text-slate-400">{i + 1}</span>
                    <div className="grid flex-1 grid-cols-4 gap-2 sm:grid-cols-5">
                      <div className="col-span-1">
                        <label className="label">날짜</label>
                        <DatePicker size="sm" value={r.date} onChange={v => upd(r._key, 'date', v)} placeholder="날짜" />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <label className="label">기항지</label>
                        <Input value={r.port} onChange={e => upd(r._key, 'port', e.target.value)} placeholder="바르셀로나 (스페인)" className="h-7 text-sm" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="label">도착</label>
                        <TimePicker size="sm" value={r.arrival_time} onChange={v => upd(r._key, 'arrival_time', v)} />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="label">출발</label>
                        <TimePicker size="sm" value={r.departure_time} onChange={v => upd(r._key, 'departure_time', v)} />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="label">구분</label>
                        <SelectOrInput
                          value={r.category}
                          options={ITINERARY_CATEGORIES}
                          onChange={v => upd(r._key, 'category', v)}
                          placeholder="구분"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="label">통화</label>
                        <FieldSelect
                          value={r.cost_currency || 'USD'}
                          options={CURRENCY_OPTIONS}
                          onChange={v => upd(r._key, 'cost_currency', v)}
                          className="h-7 text-sm"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="label">비용 (인당)</label>
                        <Input value={r.cost} onChange={e => upd(r._key, 'cost', e.target.value)} placeholder="0" className="h-7 text-sm" />
                      </div>
                      <div className="col-span-2 sm:col-span-2">
                        <label className="label">비고</label>
                        <Input value={r.summary} onChange={e => upd(r._key, 'summary', e.target.value)} placeholder="주요 관광지, 이동 정보 등" className="h-7 text-sm" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(r._key)}
                      className="mt-2 shrink-0 rounded p-1 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {managerOpen && (
          <ItineraryPresetManager onClose={() => setManagerOpen(false)} />
        )}
      </>
    )
  }

  // ── 보기 모드 ────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader>
        <CardTitle>기항지 일정</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{days.length}일</span>
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
        {days.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">등록된 일정이 없습니다</p>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead className="whitespace-nowrap">날짜</TableHead>
                  <TableHead>기항지</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">구분</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">요금</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">도착</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">출발</TableHead>
                  <TableHead className="hidden sm:table-cell">비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map((d, i) => {
                  const isSea = d.port.includes(SEA_DAY)
                  return (
                    <TableRow key={d.id} className={isSea ? 'bg-slate-50/80 text-slate-400' : ''}>
                      <TableCell className="text-slate-400 text-xs">{i + 1}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-sm">{formatDate(d.date)}</TableCell>
                      <TableCell className={isSea ? 'italic' : 'font-medium'}>{d.port}</TableCell>
                      <TableCell className="hidden sm:table-cell whitespace-nowrap">
                        {d.category ? (
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600">
                            {d.category}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell whitespace-nowrap text-sm">
                        {d.cost != null ? (
                          <span className="text-slate-700">
                            {d.cost_currency && <span className="text-slate-400 text-xs mr-0.5">{currencySymbol(d.cost_currency)}</span>}
                            {Number(d.cost).toLocaleString()}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap hidden sm:table-cell">{formatTime(d.arrival_time)}</TableCell>
                      <TableCell className="whitespace-nowrap hidden sm:table-cell">{formatTime(d.departure_time)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-slate-500 text-xs max-w-40 truncate">{d.summary ?? ''}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
