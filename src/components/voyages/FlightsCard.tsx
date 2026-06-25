import { useState, useEffect, useRef, Fragment } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Check, X, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TimePicker } from '@/components/ui/time-picker'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { saveFlight, deleteFlightRow } from '@/lib/queries/voyages'
import { useFlightCalc } from '@/hooks/useFlightCalc'
import type { Flight } from '@/types/database'

function formatKrw(n: number): string {
  return n > 0 ? n.toLocaleString('ko-KR') + '원' : '—'
}

function extractIata(str: string): string {
  const m = str?.match(/\(([A-Z]{3})\)/)
  return m ? m[1] : (str?.trim().toUpperCase() ?? '')
}

// ── 타입 ─────────────────────────────────────────────────────────────────────
type SegmentDraft = {
  flight_no:      string
  origin:         string
  destination:    string
  departure_date: string
  departure_time: string
  arrival_date:   string
  arrival_time:   string
  duration:       string
}

const EMPTY_SEGMENT: SegmentDraft = {
  flight_no: '', origin: '', destination: '',
  departure_date: '', departure_time: '',
  arrival_date: '', arrival_time: '', duration: '',
}

type DraftFlight = {
  _key:         string
  _isNew:       boolean
  _deleted:     boolean
  id:           string
  fare:         string
  sort_order:   number
  seats_group:  string
  seats_indivi: string
  seats_business: string
  fare_base:    string
  fare_fuel:    string
  fare_tax:     string
  segments:     SegmentDraft[]
}

function toDraft(f: Flight): DraftFlight {
  let segments: SegmentDraft[] = (f.segments ?? []).map(s => ({
    flight_no:      s.flight_no      ?? '',
    origin:         s.origin         ?? '',
    destination:    s.destination    ?? '',
    departure_date: s.departure_date ?? '',
    departure_time: s.departure_time ?? '',
    arrival_date:   s.arrival_date   ?? '',
    arrival_time:   s.arrival_time   ?? '',
    duration:       s.duration       ?? '',
  }))

  // 레거시 마이그레이션: flat 필드 → 첫 구간
  if (segments.length === 0 && (f.flight_no || f.origin || f.destination || f.departure_date)) {
    segments = [{
      flight_no:      f.flight_no      ?? '',
      origin:         f.origin         ?? '',
      destination:    f.destination    ?? '',
      departure_date: f.departure_date ?? '',
      departure_time: f.departure_time ?? '',
      arrival_date:   f.arrival_date   ?? '',
      arrival_time:   f.arrival_time   ?? '',
      duration:       f.duration       ?? '',
    }]
  }

  return {
    _key: f.id, _isNew: false, _deleted: false, id: f.id,
    fare:           f.fare != null ? String(f.fare) : '',
    sort_order:     f.sort_order,
    seats_group:    String(f.seats_group    ?? 0),
    seats_indivi:   String(f.seats_indivi   ?? 0),
    seats_business: String(f.seats_business ?? 0),
    fare_base:      String(f.fare_base      ?? 0),
    fare_fuel:      String(f.fare_fuel      ?? 0),
    fare_tax:       String(f.fare_tax       ?? 0),
    segments,
  }
}

const EMPTY: Omit<DraftFlight, '_key'> = {
  _isNew: true, _deleted: false, id: '',
  fare: '', sort_order: 0,
  seats_group: '0', seats_indivi: '0', seats_business: '0',
  fare_base: '0', fare_fuel: '0', fare_tax: '0',
  segments: [],
}

function toInput(r: DraftFlight, _voyageId: string, idx: number) {
  const first = r.segments[0]
  return {
    // 첫 구간을 flat 컬럼에도 미러링 (하위 호환)
    flight_no:      first?.flight_no      || null,
    origin:         first?.origin         || null,
    destination:    first?.destination    || null,
    departure_date: first?.departure_date || null,
    departure_time: first?.departure_time || null,
    arrival_date:   first?.arrival_date   || null,
    arrival_time:   first?.arrival_time   || null,
    duration:       first?.duration       || null,
    fare:           r.fare ? Number(r.fare) : null,
    sort_order:     r.sort_order || idx + 1,
    seats_group:    Number(r.seats_group)    || 0,
    seats_indivi:   Number(r.seats_indivi)   || 0,
    seats_business: Number(r.seats_business) || 0,
    fare_base:      Number(r.fare_base)      || 0,
    fare_fuel:      Number(r.fare_fuel)      || 0,
    fare_tax:       Number(r.fare_tax)       || 0,
    segments:       r.segments.map(s => ({
      flight_no:      s.flight_no      || null,
      origin:         s.origin         || null,
      destination:    s.destination    || null,
      departure_date: s.departure_date || null,
      departure_time: s.departure_time || null,
      arrival_date:   s.arrival_date   || null,
      arrival_time:   s.arrival_time   || null,
      duration:       s.duration       || null,
    })),
  }
}

// ── 구간 편집 행 ──────────────────────────────────────────────────────────────
function SegmentDraftRow({
  seg, segIndex, onUpdate, onRemove, autoFocus = false,
}: {
  seg: SegmentDraft
  segIndex: number
  onUpdate: (field: keyof SegmentDraft, value: string) => void
  onRemove: () => void
  autoFocus?: boolean
}) {
  const { result, isValid } = useFlightCalc({
    departureAirport: extractIata(seg.origin),
    arrivalAirport:   extractIata(seg.destination),
    departureDate:    seg.departure_date,
    departureTime:    seg.departure_time,
    arrivalDate:      seg.arrival_date,
    arrivalTime:      seg.arrival_time,
  })
  const [isManual, setIsManual] = useState(false)
  const lastAutoRef = useRef<string | null>(null)
  const flightNoRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (autoFocus) flightNoRef.current?.focus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isValid || !result || isManual) return
    const newText = result.durationText
    if (newText === lastAutoRef.current) return
    onUpdate('duration', newText)
    lastAutoRef.current = newText
  }, [result?.durationText, isValid, isManual])

  return (
    <div className="relative rounded border border-slate-200 bg-white p-2.5">
      <button type="button" onClick={onRemove}
        className="absolute right-1.5 top-1.5 rounded p-0.5 text-slate-300 hover:text-red-500 transition">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <p className="text-[10px] font-medium text-slate-400 mb-2">{segIndex + 1}구간</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <label className="label">편명</label>
          <Input ref={flightNoRef} value={seg.flight_no} onChange={e => onUpdate('flight_no', e.target.value)} placeholder="KE907" className="h-7 text-sm" />
        </div>
        <div>
          <label className="label">출발지</label>
          <Input value={seg.origin} onChange={e => onUpdate('origin', e.target.value)} placeholder="인천(ICN)" className="h-7 text-sm" />
        </div>
        <div>
          <label className="label">도착지</label>
          <Input value={seg.destination} onChange={e => onUpdate('destination', e.target.value)} placeholder="바르셀로나(BCN)" className="h-7 text-sm" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="label mb-0 whitespace-nowrap">소요 시간</label>
            {isValid && result && (
              isManual ? (
                <button type="button" onClick={() => { setIsManual(false); lastAutoRef.current = null }}
                  className="flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-brand transition">
                  <Zap className="h-2.5 w-2.5" /> 자동으로
                </button>
              ) : (
                <span className="flex items-center gap-0.5 text-[10px] text-brand">
                  <Zap className="h-2.5 w-2.5" /> 자동
                </span>
              )
            )}
          </div>
          <Input
            value={seg.duration}
            onChange={e => { setIsManual(true); onUpdate('duration', e.target.value) }}
            placeholder="자동 계산"
            className={`h-7 text-sm ${isValid && result && !isManual ? 'border-brand/40 bg-brand/5' : ''}`}
          />
        </div>
        <div>
          <label className="label">출발일</label>
          <DatePicker size="sm" value={seg.departure_date} onChange={v => onUpdate('departure_date', v)} placeholder="출발일" />
        </div>
        <div>
          <label className="label">출발 시간</label>
          <TimePicker size="sm" value={seg.departure_time} onChange={v => onUpdate('departure_time', v)} />
        </div>
        <div>
          <label className="label">도착일</label>
          <DatePicker size="sm" value={seg.arrival_date} onChange={v => onUpdate('arrival_date', v)} placeholder="도착일" />
        </div>
        <div>
          <label className="label">도착 시간</label>
          <TimePicker size="sm" value={seg.arrival_time} onChange={v => onUpdate('arrival_time', v)} />
        </div>
      </div>
    </div>
  )
}

// ── 항공편 편집 행 ────────────────────────────────────────────────────────────
function FlightDraftRow({
  r, index, onRemove, onUpdate,
}: {
  r: DraftFlight
  index: number
  onRemove: () => void
  onUpdate: (updater: (prev: DraftFlight) => DraftFlight) => void
}) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [focusTarget, setFocusTarget] = useState<number | null>(null)

  const totalSeats = (Number(r.seats_group) || 0) + (Number(r.seats_indivi) || 0) + (Number(r.seats_business) || 0)
  const totalFare  = (Number(r.fare_base) || 0) + (Number(r.fare_fuel) || 0) + (Number(r.fare_tax) || 0)

  function updSeg(segIdx: number, field: keyof SegmentDraft, value: string) {
    onUpdate(prev => ({
      ...prev,
      segments: prev.segments.map((s, i) => i === segIdx ? { ...s, [field]: value } : s),
    }))
  }

  function addSeg() {
    setFocusTarget(r.segments.length)
    onUpdate(prev => ({ ...prev, segments: [...prev.segments, { ...EMPTY_SEGMENT }] }))
    setDetailOpen(true)
  }

  function removeSeg(segIdx: number) {
    onUpdate(prev => ({ ...prev, segments: prev.segments.filter((_, i) => i !== segIdx) }))
  }

  function updMain(field: keyof DraftFlight, value: string) {
    onUpdate(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="relative rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-2">
      <button type="button" onClick={onRemove}
        className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:text-red-500 transition">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <span className="block text-xs font-medium text-slate-400">{index + 1}편</span>

      {/* ── 좌석 수식 (메인) ── */}
      <div className="flex flex-wrap gap-2 items-end">
        {([
          ['seats_group', '그룹'],
          ['seats_indivi', '인디비'],
          ['seats_business', '비즈니스'],
        ] as [keyof DraftFlight, string][]).map(([field, label], idx) => (
          <Fragment key={field}>
            <div>
              <label className="label">{label} (석)</label>
              <Input
                value={r[field] as string}
                onChange={e => updMain(field, e.target.value)}
                type="number" min={0} placeholder="좌석 수"
                className="h-7 text-sm w-20 text-right"
              />
            </div>
            {idx < 2 && <span className="text-slate-400 text-sm pb-1.5">+</span>}
          </Fragment>
        ))}
        <span className="text-slate-400 text-sm pb-1.5">=</span>
        <div>
          <label className="label text-brand">총 좌석</label>
          <div className="h-7 flex items-center rounded-md border border-brand/20 bg-brand/5 px-2 text-sm font-semibold text-brand min-w-[64px]">
            {totalSeats.toLocaleString('ko-KR')}석
          </div>
        </div>
      </div>

      {/* ── 항공료 수식 (메인) ── */}
      <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-slate-100">
        {([
          ['fare_base', '운임'],
          ['fare_fuel', '유류할증료'],
          ['fare_tax', '발권피'],
        ] as [keyof DraftFlight, string][]).map(([field, label], idx) => (
          <Fragment key={field}>
            <div>
              <label className="label">{label} (원)</label>
              <Input
                value={r[field] as string}
                onChange={e => updMain(field, e.target.value)}
                type="number" min={0} placeholder="0"
                className="h-7 text-sm w-28 text-right"
              />
            </div>
            {idx < 2 && <span className="text-slate-400 text-sm pb-1.5">+</span>}
          </Fragment>
        ))}
        <span className="text-slate-400 text-sm pb-1.5">=</span>
        <div>
          <label className="label text-brand">항공료</label>
          <div className="h-7 flex items-center rounded-md border border-brand/20 bg-brand/5 px-2 text-sm font-semibold text-brand min-w-[96px]">
            {totalFare.toLocaleString('ko-KR')}원
          </div>
        </div>
      </div>

      {/* ── 편명·날짜·시각 구간 (하위, 접이식 + 복수 추가) ── */}
      <div className="border-t border-slate-100">
        <button type="button" onClick={() => {
          const opening = !detailOpen
          setDetailOpen(o => !o)
          setFocusTarget(opening ? 0 : null)
        }}
          className="flex items-center gap-1 mt-2 text-xs text-slate-400 hover:text-brand transition">
          {detailOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          편명 · 날짜 · 시각 상세
          {r.segments.length > 0 && (
            <span className="ml-1 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
              총 {r.segments.length}구간
            </span>
          )}
        </button>

        {detailOpen && (
          <div className="mt-2 space-y-2">
            {r.segments.map((seg, si) => (
              <SegmentDraftRow
                key={si}
                seg={seg}
                segIndex={si}
                onUpdate={(field, value) => updSeg(si, field, value)}
                onRemove={() => removeSeg(si)}
                autoFocus={si === focusTarget}
              />
            ))}
            <button type="button" onClick={addSeg}
              className="flex items-center gap-1 text-xs text-brand hover:bg-brand/10 rounded px-2 py-1.5 transition">
              <Plus className="h-3 w-3" /> 구간 추가
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function FlightsCard({
  flights,
  voyageId,
  canWrite = true,
  airline,
  airlineReturn,
}: {
  flights: Flight[]
  voyageId: string
  canWrite?: boolean
  airline?: string | null
  airlineReturn?: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DraftFlight[]>([])
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set())
  const qc = useQueryClient()

  function toggleExpanded(id: string) {
    setExpandedSet(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      let idx = 0
      await Promise.all(draft.map(r => {
        if (r._deleted && !r._isNew) return deleteFlightRow(r.id)
        if (r._isNew && !r._deleted) return saveFlight(voyageId, toInput(r, voyageId, idx++))
        if (!r._isNew && !r._deleted) return saveFlight(voyageId, toInput(r, voyageId, idx++), r.id)
        return Promise.resolve()
      }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flights', voyageId] })
      setEditing(false)
      setDraft([])
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  function startEdit() {
    setDraft(flights.map(toDraft))
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
      ).filter((r): r is DraftFlight => r !== null)
    )
  }

  function upd(key: string, updater: (prev: DraftFlight) => DraftFlight) {
    setDraft(d => d.map(r => r._key === key ? updater(r) : r))
  }

  const visible = draft.filter(r => !r._deleted)

  // ── 편집 모드 ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <Card>
        <CardHeader>
          <div>
            <CardTitle>항공</CardTitle>
            {(airline || airlineReturn) && (
              <p className="mt-0.5 text-xs text-slate-500">
                {airline && airlineReturn ? `${airline} / ${airlineReturn}` : (airline ?? airlineReturn)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={saveMut.isPending}>
              <Plus className="h-3.5 w-3.5" /> 행 추가
            </Button>
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-50 transition disabled:opacity-40">
              <Check className="h-3.5 w-3.5" />{saveMut.isPending ? '저장 중…' : '저장'}
            </button>
            <button onClick={() => { setEditing(false); setDraft([]) }} disabled={saveMut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-400 hover:bg-slate-100 transition">
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
              <p className="py-4 text-center text-sm text-slate-400">행 추가를 눌러 항공편을 등록하세요</p>
            ) : (
              visible.map((r, i) => (
                <FlightDraftRow
                  key={r._key}
                  r={r}
                  index={i}
                  onRemove={() => removeRow(r._key)}
                  onUpdate={updater => upd(r._key, updater)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── 조회 모드 ──────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>항공</CardTitle>
          {(airline || airlineReturn) && (
            <p className="mt-0.5 text-xs text-slate-500">
              {airline && airlineReturn ? `${airline} / ${airlineReturn}` : (airline ?? airlineReturn)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{flights.length}편</span>
          {canWrite && (
            <button onClick={startEdit}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="편집">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {flights.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">등록된 항공편이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {flights.map((f, i) => {
              const totalSeats = (f.seats_group ?? 0) + (f.seats_indivi ?? 0) + (f.seats_business ?? 0)
              const totalFare  = (f.fare_base ?? 0) + (f.fare_fuel ?? 0) + (f.fare_tax ?? 0)

              // 구간 목록 (없으면 flat 필드로 레거시 표시)
              // 기존 segments JSONB에 arrival_date/time 없으면 flat 컬럼 폴백 (첫 구간만)
              const segs = (f.segments ?? []).length > 0
                ? (f.segments ?? []).map((s, idx) => ({
                    ...s,
                    arrival_date: s.arrival_date || (idx === 0 ? f.arrival_date : null),
                    arrival_time: s.arrival_time || (idx === 0 ? f.arrival_time : null),
                  }))
                : (f.flight_no || f.origin || f.destination || f.departure_date)
                  ? [{ flight_no: f.flight_no, origin: f.origin, destination: f.destination,
                        departure_date: f.departure_date, departure_time: f.departure_time,
                        arrival_date: f.arrival_date, arrival_time: f.arrival_time, duration: f.duration }]
                  : []

              return (
                <div key={f.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-2">
                  <span className="block text-sm font-medium text-slate-400">{i + 1}편</span>

                  {/* 좌석 수식 */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {(['seats_group', 'seats_indivi', 'seats_business'] as const).map((field, idx) => (
                      <Fragment key={field}>
                        <span className="text-slate-400">
                          {field === 'seats_group' ? '그룹' : field === 'seats_indivi' ? '인디비' : '비즈니스'}
                          {' '}<span className="font-semibold text-slate-700">{(f[field] ?? 0).toLocaleString('ko-KR')}</span>석
                        </span>
                        {idx < 2 && <span className="text-slate-300">+</span>}
                      </Fragment>
                    ))}
                    <span className="text-slate-300">=</span>
                    <span className="text-slate-400">총 <span className="font-semibold text-brand">{totalSeats.toLocaleString('ko-KR')}</span>석</span>
                  </div>

                  {/* 항공료 수식 */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {(['fare_base', 'fare_fuel', 'fare_tax'] as const).map((field, idx) => (
                      <Fragment key={field}>
                        <span className="text-slate-400">
                          {field === 'fare_base' ? '운임' : field === 'fare_fuel' ? '유류할증료' : '발권피'}
                          {' '}<span className="font-semibold text-slate-700">{formatKrw(f[field] ?? 0)}</span>
                        </span>
                        {idx < 2 && <span className="text-slate-300">+</span>}
                      </Fragment>
                    ))}
                    <span className="text-slate-300">=</span>
                    <span className="font-semibold text-brand">{formatKrw(totalFare)}</span>
                  </div>

                  {/* 구간 목록 — 꺽새 토글 */}
                  {segs.length > 0 && (
                    <div className="border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(f.id)}
                        className="flex items-center gap-1 mt-2 text-sm font-semibold text-slate-600 hover:text-brand transition"
                      >
                        {expandedSet.has(f.id)
                          ? <ChevronDown className="h-3.5 w-3.5" />
                          : <ChevronRight className="h-3.5 w-3.5" />}
                        편명 · 날짜 · 시각
                        <span className="ml-1 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                          총 {segs.length}구간
                        </span>
                      </button>

                      {expandedSet.has(f.id) && (
                        <div className="mt-2 space-y-1">
                          {segs.map((s, si) => {
                            const hasInfo = s.flight_no || s.origin || s.destination || s.departure_date
                            if (!hasInfo) return null
                            return (
                              <div key={si} className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-400">
                                {segs.length > 1 && <span className="text-slate-300">{si + 1}구간</span>}
                                {s.flight_no && <span className="font-mono font-medium text-slate-600">{s.flight_no}</span>}
                                {(s.origin || s.destination) && (
                                  <span>{s.origin ?? '—'} → {s.destination ?? '—'}</span>
                                )}
                                {s.departure_date && <span className="text-slate-600">{formatDate(s.departure_date)}</span>}
                                {s.departure_time && <span className="text-slate-600">{formatTime(s.departure_time)}</span>}
                                {(s.arrival_date || s.arrival_time) && (
                                  <span className="text-slate-300">→</span>
                                )}
                                {s.arrival_date && <span className="text-slate-600">{formatDate(s.arrival_date)}</span>}
                                {s.arrival_time && <span className="text-slate-600">{formatTime(s.arrival_time)}</span>}
                                {s.duration && <span className="text-slate-400">{s.duration}</span>}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
