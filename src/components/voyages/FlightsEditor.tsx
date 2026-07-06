import { useRef, useState, useEffect } from 'react'
import { useFieldArray, useFormContext, Controller, useWatch } from 'react-hook-form'
import { Plus, Trash2, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { useFlightCalc } from '@/hooks/useFlightCalc'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const EMPTY_FLIGHT = {
  label: '',
  flight_no: '', origin: '', destination: '',
  departure_date: '', arrival_date: '',
  departure_time: '', arrival_time: '',
  duration: '', fare: undefined, sort_order: 0,
  seats_group: undefined, seats_indivi: undefined, seats_business: undefined,
  fare_base: 0, fare_fuel: 0, fare_tax: 0,
  fare_base_indivi: 0, fare_fuel_indivi: 0, fare_tax_indivi: 0,
  fare_base_business: 0, fare_fuel_business: 0, fare_tax_business: 0,
  segments: [],
}

const EMPTY_SEGMENT = {
  flight_no: '', origin: '', destination: '',
  departure_date: '', departure_time: '',
  arrival_date: '', arrival_time: '', duration: '',
}

function extractIata(str: string): string {
  const m = str?.match(/\(([A-Z]{3})\)/)
  return m ? m[1] : (str?.trim().toUpperCase() ?? '')
}

/** 구간(편명·구간·일시) 내용이 같으면 같은 그룹으로 묶어 하나의 구간 섹션을 공유한다 */
function segmentsKey(segments: VoyageFormValues['flights'][number]['segments'] | undefined): string {
  if (!segments || segments.length === 0) return ''
  return JSON.stringify(segments.map(s => [
    s.flight_no, s.origin, s.destination,
    s.departure_date, s.departure_time, s.arrival_date, s.arrival_time,
  ]))
}

// ── 구간 한 행 ──────────────────────────────────────────────────────────────
function SegmentRow({
  flightIndex,
  segIndex,
  onRemove,
  autoFocus = false,
}: {
  flightIndex: number
  segIndex: number
  onRemove: () => void
  autoFocus?: boolean
}) {
  const { register, control, setValue } = useFormContext<VoyageFormValues>()
  const [isManual, setIsManual] = useState(false)
  const lastAutoRef = useRef<string | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!autoFocus) return
    const id = setTimeout(() => {
      gridRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    }, 0)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = `flights.${flightIndex}.segments.${segIndex}` as any

  const origin      = useWatch({ control, name: `${base}.origin` })
  const destination = useWatch({ control, name: `${base}.destination` })
  const depDate     = useWatch({ control, name: `${base}.departure_date` })
  const depTime     = useWatch({ control, name: `${base}.departure_time` })
  const arrDate     = useWatch({ control, name: `${base}.arrival_date` })
  const arrTime     = useWatch({ control, name: `${base}.arrival_time` })

  const { result, isValid } = useFlightCalc({
    departureAirport: extractIata(origin ?? ''),
    arrivalAirport:   extractIata(destination ?? ''),
    departureDate:    depDate ?? '',
    departureTime:    depTime ?? '',
    arrivalDate:      arrDate ?? '',
    arrivalTime:      arrTime ?? '',
  })

  useEffect(() => {
    if (!isValid || !result || isManual) return
    const newText = result.durationText
    if (newText === lastAutoRef.current) return
    setValue(`${base}.duration`, newText, { shouldDirty: true })
    lastAutoRef.current = newText
  }, [result?.durationText, isValid, isManual])

  const durationReg = register(`${base}.duration`)

  return (
    <div className="relative rounded border border-slate-200 bg-white p-2.5">
      <button type="button" onClick={onRemove}
        className="absolute right-1.5 top-1.5 rounded p-0.5 text-slate-300 hover:text-red-500 transition">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <p className="text-[10px] font-medium text-slate-400 mb-2">{segIndex + 1}구간</p>
      <div ref={gridRef} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <label className="label">편명</label>
          <Input
            {...register(`${base}.flight_no`)}
            placeholder="KE907"
          />
        </div>
        <div>
          <label className="label">출발지</label>
          <Input {...register(`${base}.origin`)} placeholder="IATA CODE" />
        </div>
        <div>
          <label className="label">도착지</label>
          <Input {...register(`${base}.destination`)} placeholder="IATA CODE" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="label mb-0">소요 시간</label>
            {isValid && result && (
              isManual ? (
                <button type="button"
                  onClick={() => { setIsManual(false); lastAutoRef.current = null }}
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
            {...durationReg}
            onChange={e => { setIsManual(true); durationReg.onChange(e) }}
            placeholder="자동 계산"
            className={isValid && result && !isManual ? 'border-brand/40 bg-brand/5' : ''}
          />
        </div>
        <div>
          <label className="label">출발일</label>
          <Controller name={`${base}.departure_date`} control={control}
            render={({ field }) => <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder="출발일" />} />
        </div>
        <div>
          <label className="label">출발 시간</label>
          <Controller name={`${base}.departure_time`} control={control}
            render={({ field }) => <TimePicker value={field.value ?? ''} onChange={field.onChange} />} />
        </div>
        <div>
          <label className="label">도착일</label>
          <Controller name={`${base}.arrival_date`} control={control}
            render={({ field }) => <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder="도착일" />} />
        </div>
        <div>
          <label className="label">도착 시간</label>
          <Controller name={`${base}.arrival_time`} control={control}
            render={({ field }) => <TimePicker value={field.value ?? ''} onChange={field.onChange} />} />
        </div>
      </div>
    </div>
  )
}

// ── 좌석 등급별 운임 소블록 (그룹석은 fare_base 등 기존 필드, 인디비·비즈니스는 접미사 필드) ──
function FareTierBlock({ index, suffix, title }: { index: number; suffix: '' | '_indivi' | '_business'; title: string }) {
  const { register, control } = useFormContext<VoyageFormValues>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = `flights.${index}` as any

  const [fb, ff, ft] = useWatch({
    control,
    name: [`${base}.fare_base${suffix}`, `${base}.fare_fuel${suffix}`, `${base}.fare_tax${suffix}`] as any,
  }).map((v: unknown) => Number(v) || 0)
  const subtotal = fb + ff + ft

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="label">운임 (원)</label>
          <Input {...register(`${base}.fare_base${suffix}` as any, { valueAsNumber: true })}
            type="number" min={0} placeholder="0" className="w-28 text-right" />
        </div>
        <span className="text-slate-400 text-sm pb-2">+</span>
        <div>
          <label className="label">유류할증료 (원)</label>
          <Input {...register(`${base}.fare_fuel${suffix}` as any, { valueAsNumber: true })}
            type="number" min={0} placeholder="0" className="w-28 text-right" />
        </div>
        <span className="text-slate-400 text-sm pb-2">+</span>
        <div>
          <label className="label">발권피 (원)</label>
          <Input {...register(`${base}.fare_tax${suffix}` as any, { valueAsNumber: true })}
            type="number" min={0} placeholder="0" className="w-28 text-right" />
        </div>
        <span className="text-slate-400 text-sm pb-2">=</span>
        <div>
          <label className="label text-brand">소계</label>
          <div className="h-9 flex items-center rounded-md border border-brand/20 bg-brand/5 px-3 text-sm font-semibold text-brand min-w-[100px]">
            {subtotal.toLocaleString('ko-KR')}원
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 메인(좌석/운임) 한 블록 — 그룹 안에 여러 개 나열될 수 있음 ──────────────────
function FlightMainOnly({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { register, control } = useFormContext<VoyageFormValues>()

  const [sg, si, sb, fb, ff, ft, fbi, ffi, fti, fbb, ffb, ftb] = useWatch({
    control,
    name: [
      `flights.${index}.seats_group`,
      `flights.${index}.seats_indivi`,
      `flights.${index}.seats_business`,
      `flights.${index}.fare_base`,
      `flights.${index}.fare_fuel`,
      `flights.${index}.fare_tax`,
      `flights.${index}.fare_base_indivi`,
      `flights.${index}.fare_fuel_indivi`,
      `flights.${index}.fare_tax_indivi`,
      `flights.${index}.fare_base_business`,
      `flights.${index}.fare_fuel_business`,
      `flights.${index}.fare_tax_business`,
    ],
  }).map(v => Number(v) || 0)
  const totalSeats = sg + si + sb
  const totalFare  = fb + ff + ft + fbi + ffi + fti + fbb + ffb + ftb
  const [showIndivi, setShowIndivi]     = useState(fbi + ffi + fti > 0)
  const [showBusiness, setShowBusiness] = useState(fbb + ffb + ftb > 0)

  return (
    <div className="relative rounded-lg border border-slate-100 bg-white p-4 space-y-3">
      <button type="button" onClick={onRemove}
        className="absolute right-3 top-3 rounded p-1 text-slate-300 hover:text-red-500 transition">
        <Trash2 className="h-4 w-4" />
      </button>

      {/* ── 좌석 수식 (메인) ── */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="label">그룹 (석)</label>
          <Input {...register(`flights.${index}.seats_group`, { valueAsNumber: true })}
            type="number" min={0} placeholder="좌석 수" className="w-24 text-right" />
        </div>
        <span className="text-slate-400 text-sm pb-2">+</span>
        <div>
          <label className="label">인디비 (석)</label>
          <Input {...register(`flights.${index}.seats_indivi`, { valueAsNumber: true })}
            type="number" min={0} placeholder="좌석 수" className="w-24 text-right" />
        </div>
        <span className="text-slate-400 text-sm pb-2">+</span>
        <div>
          <label className="label">비즈니스 (석)</label>
          <Input {...register(`flights.${index}.seats_business`, { valueAsNumber: true })}
            type="number" min={0} placeholder="좌석 수" className="w-24 text-right" />
        </div>
        <span className="text-slate-400 text-sm pb-2">=</span>
        <div>
          <label className="label text-brand">총 좌석</label>
          <div className="h-9 flex items-center rounded-md border border-brand/20 bg-brand/5 px-3 text-sm font-semibold text-brand min-w-[72px]">
            {totalSeats.toLocaleString('ko-KR')}석
          </div>
        </div>
      </div>

      {/* ── 항공료 수식 (좌석 등급별) ── */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <FareTierBlock index={index} suffix="" title="그룹석" />

        {showIndivi ? (
          <FareTierBlock index={index} suffix="_indivi" title="인디비 석" />
        ) : (
          <button type="button" onClick={() => setShowIndivi(true)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand transition">
            <Plus className="h-3 w-3" /> 인디비 석 요금 추가
          </button>
        )}

        {showBusiness ? (
          <FareTierBlock index={index} suffix="_business" title="비즈니스 석" />
        ) : (
          <button type="button" onClick={() => setShowBusiness(true)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand transition">
            <Plus className="h-3 w-3" /> 비즈니스 석 요금 추가
          </button>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="label text-brand">항공료 합계</span>
          <div className="h-8 flex items-center rounded-md border border-brand/20 bg-brand/5 px-3 text-sm font-semibold text-brand">
            {totalFare.toLocaleString('ko-KR')}원
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 항공편 그룹 (메인 여러 개 + 구간 1개 공유) ─────────────────────────────────
function FlightGroupBlock({
  indices, onRemoveOne, onAddMain,
}: {
  indices: number[]
  onRemoveOne: (index: number) => void
  onAddMain: () => void
}) {
  const { control, setValue } = useFormContext<VoyageFormValues>()
  const leadIndex = indices[0]
  // 새 행사 등록 폼은 항상 처음부터 입력하는 것이라, 편명·구간 상세를 접어두지 않고 바로 펼쳐서 보여준다
  const [detailOpen, setDetailOpen] = useState(true)
  const [newSegIdx, setNewSegIdx] = useState<number | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { fields: segments, append: appendSeg, remove: removeSeg } = useFieldArray({
    control,
    name: `flights.${leadIndex}.segments` as any,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadSegments = useWatch({ control, name: `flights.${leadIndex}.segments` as any }) as VoyageFormValues['flights'][number]['segments']
  const otherIndices = indices.slice(1)
  const leadSegmentsKey = segmentsKey(leadSegments)

  // 그룹 내 다른 메인들도 같은 구간을 공유하도록 값 동기화
  useEffect(() => {
    if (otherIndices.length === 0) return
    const cloned = (leadSegments ?? []).map(s => ({ ...s }))
    for (const i of otherIndices) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(`flights.${i}.segments` as any, cloned, { shouldDirty: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadSegmentsKey, otherIndices.join(',')])

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-3">
      <div className="space-y-3">
        {indices.map(i => (
          <FlightMainOnly key={i} index={i} onRemove={() => onRemoveOne(i)} />
        ))}
      </div>

      <button type="button" onClick={onAddMain}
        title="편명·구간·일시는 그대로 복제하고 좌석·운임만 새로 입력합니다"
        className="flex items-center gap-1 text-xs text-slate-500 hover:bg-slate-100 rounded px-2 py-1.5 transition">
        <Plus className="h-3 w-3" /> 같은 구간으로 좌석 수 및 요금 추가
      </button>

      {/* ── 편명·날짜·시각 구간 (그룹 공유, 접이식 + 복수 추가) ── */}
      <div className="border-t border-slate-100">
        <button type="button" onClick={() => setDetailOpen(o => !o)}
          className="flex items-center gap-1 mt-2 text-xs text-slate-400 hover:text-brand transition">
          {detailOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          편명 · 날짜 · 시각 상세
          {segments.length > 0 && (
            <span className="ml-1 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
              총 {segments.length}구간
            </span>
          )}
        </button>

        {detailOpen && (
          <div className="mt-2 space-y-2">
            {segments.map((seg, si) => (
              <SegmentRow
                key={seg.id}
                flightIndex={leadIndex}
                segIndex={si}
                onRemove={() => removeSeg(si)}
                autoFocus={si === newSegIdx}
              />
            ))}
            <button type="button" onClick={() => { setNewSegIdx(segments.length); appendSeg(EMPTY_SEGMENT, { shouldFocus: false }) }}
              className="flex items-center gap-1 text-xs text-brand hover:bg-brand/10 rounded px-2 py-1.5 transition">
              <Plus className="h-3 w-3" /> 구간 추가
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export default function FlightsEditor() {
  const { control, getValues } = useFormContext<VoyageFormValues>()
  const { fields, append, insert, remove } = useFieldArray<VoyageFormValues, 'flights'>({ name: 'flights' })
  const watchedFlights = useWatch({ control, name: 'flights' })

  // 인접한 같은 구간(segments) 값을 가진 메인들을 하나의 그룹으로 묶는다
  const groups: number[][] = []
  fields.forEach((_, i) => {
    const key = segmentsKey(watchedFlights?.[i]?.segments)
    const last = groups[groups.length - 1]
    if (key && last && segmentsKey(watchedFlights?.[last[0]]?.segments) === key) last.push(i)
    else groups.push([i])
  })

  function duplicateRow(afterIndex: number) {
    const segments = getValues(`flights.${afterIndex}.segments`)
    insert(afterIndex + 1, { ...EMPTY_FLIGHT, segments: segments.map(s => ({ ...s })) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>항공</CardTitle>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => append({ ...EMPTY_FLIGHT, segments: [{ ...EMPTY_SEGMENT }] })}>
            <Plus className="h-4 w-4" /> 직접 입력
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">항공편을 직접 입력하세요</p>
        ) : (
          groups.map(indices => (
            <FlightGroupBlock
              key={fields[indices[0]].id}
              indices={indices}
              onRemoveOne={i => remove(i)}
              onAddMain={() => duplicateRow(indices[indices.length - 1])}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
