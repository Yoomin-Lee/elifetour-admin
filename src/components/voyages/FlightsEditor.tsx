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
  flight_no: '', origin: '', destination: '',
  departure_date: '', arrival_date: '',
  departure_time: '', arrival_time: '',
  duration: '', fare: undefined, sort_order: 0,
  seats_group: 0, seats_indivi: 0, seats_business: 0,
  fare_base: 0, fare_fuel: 0, fare_tax: 0,
}

/** "(ICN)" 형식 또는 단순 공항코드 추출 */
function extractIata(str: string): string {
  const m = str?.match(/\(([A-Z]{3})\)/)
  return m ? m[1] : (str?.trim().toUpperCase() ?? '')
}

/** 항공편 한 행 */
function FlightRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { register, control, setValue } = useFormContext<VoyageFormValues>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [isManual, setIsManual] = useState(false)
  const lastAutoRef = useRef<string | null>(null)

  // 좌석·항공료 실시간 합산
  const [sg, si, sb, fb, ff, ft] = useWatch({
    control,
    name: [
      `flights.${index}.seats_group`,
      `flights.${index}.seats_indivi`,
      `flights.${index}.seats_business`,
      `flights.${index}.fare_base`,
      `flights.${index}.fare_fuel`,
      `flights.${index}.fare_tax`,
    ],
  }).map(v => Number(v) || 0)
  const totalSeats = sg + si + sb
  const totalFare  = fb + ff + ft

  // 소요시간 자동 계산
  const origin      = useWatch({ control, name: `flights.${index}.origin` })
  const destination = useWatch({ control, name: `flights.${index}.destination` })
  const depDate     = useWatch({ control, name: `flights.${index}.departure_date` })
  const depTime     = useWatch({ control, name: `flights.${index}.departure_time` })
  const arrDate     = useWatch({ control, name: `flights.${index}.arrival_date` })
  const arrTime     = useWatch({ control, name: `flights.${index}.arrival_time` })

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
    setValue(`flights.${index}.duration`, newText, { shouldDirty: true })
    lastAutoRef.current = newText
  }, [result?.durationText, isValid, isManual])

  const durationReg = register(`flights.${index}.duration`)

  return (
    <div className="relative rounded-lg border border-slate-100 bg-white p-4 space-y-3">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 top-3 rounded p-1 text-slate-300 hover:text-red-500 transition"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* ── 좌석 수식 (메인) ── */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="label">그룹 (석)</label>
          <Input
            {...register(`flights.${index}.seats_group`, { valueAsNumber: true })}
            type="number" min={0} placeholder="0" className="w-24 text-right"
          />
        </div>
        <span className="text-slate-400 text-sm pb-2">+</span>
        <div>
          <label className="label">인디비 (석)</label>
          <Input
            {...register(`flights.${index}.seats_indivi`, { valueAsNumber: true })}
            type="number" min={0} placeholder="0" className="w-24 text-right"
          />
        </div>
        <span className="text-slate-400 text-sm pb-2">+</span>
        <div>
          <label className="label">비즈니스 (석)</label>
          <Input
            {...register(`flights.${index}.seats_business`, { valueAsNumber: true })}
            type="number" min={0} placeholder="0" className="w-24 text-right"
          />
        </div>
        <span className="text-slate-400 text-sm pb-2">=</span>
        <div>
          <label className="label" style={{ color: 'var(--color-brand, #6366f1)' }}>총 좌석</label>
          <div className="h-9 flex items-center rounded-md border border-brand/20 bg-brand/5 px-3 text-sm font-semibold text-brand min-w-[72px]">
            {totalSeats.toLocaleString('ko-KR')}석
          </div>
        </div>
      </div>

      {/* ── 항공료 수식 (메인) ── */}
      <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-slate-100">
        <div>
          <label className="label">운임 (원)</label>
          <Input
            {...register(`flights.${index}.fare_base`, { valueAsNumber: true })}
            type="number" min={0} placeholder="0" className="w-28 text-right"
          />
        </div>
        <span className="text-slate-400 text-sm pb-2">+</span>
        <div>
          <label className="label">유류할증료 (원)</label>
          <Input
            {...register(`flights.${index}.fare_fuel`, { valueAsNumber: true })}
            type="number" min={0} placeholder="0" className="w-28 text-right"
          />
        </div>
        <span className="text-slate-400 text-sm pb-2">+</span>
        <div>
          <label className="label">발권피 (원)</label>
          <Input
            {...register(`flights.${index}.fare_tax`, { valueAsNumber: true })}
            type="number" min={0} placeholder="0" className="w-28 text-right"
          />
        </div>
        <span className="text-slate-400 text-sm pb-2">=</span>
        <div>
          <label className="label" style={{ color: 'var(--color-brand, #6366f1)' }}>항공료</label>
          <div className="h-9 flex items-center rounded-md border border-brand/20 bg-brand/5 px-3 text-sm font-semibold text-brand min-w-[100px]">
            {totalFare.toLocaleString('ko-KR')}원
          </div>
        </div>
      </div>

      {/* ── 편명·날짜·시각 상세 (하위, 접이식) ── */}
      <div className="border-t border-slate-100">
        <button
          type="button"
          onClick={() => setDetailOpen(o => !o)}
          className="flex items-center gap-1 mt-2 text-xs text-slate-400 hover:text-brand transition"
        >
          {detailOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          편명 · 날짜 · 시각 상세
        </button>

        {detailOpen && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-3">
            <div>
              <label className="label">편명</label>
              <Input {...register(`flights.${index}.flight_no`)} placeholder="KE907" />
            </div>
            <div>
              <label className="label">출발지</label>
              <Input {...register(`flights.${index}.origin`)} placeholder="인천(ICN)" />
            </div>
            <div>
              <label className="label">도착지</label>
              <Input {...register(`flights.${index}.destination`)} placeholder="바르셀로나(BCN)" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="label mb-0">소요 시간</label>
                {isValid && result && (
                  isManual ? (
                    <button
                      type="button"
                      onClick={() => { setIsManual(false); lastAutoRef.current = null }}
                      className="flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-brand transition"
                      title="자동 계산으로 되돌리기"
                    >
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
              <Controller
                name={`flights.${index}.departure_date`}
                control={control}
                render={({ field }) => (
                  <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder="출발일" />
                )}
              />
            </div>
            <div>
              <label className="label">출발 시간</label>
              <Controller
                name={`flights.${index}.departure_time`}
                control={control}
                render={({ field }) => (
                  <TimePicker value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </div>
            <div>
              <label className="label">도착일</label>
              <Controller
                name={`flights.${index}.arrival_date`}
                control={control}
                render={({ field }) => (
                  <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder="도착일" />
                )}
              />
            </div>
            <div>
              <label className="label">도착 시간</label>
              <Controller
                name={`flights.${index}.arrival_time`}
                control={control}
                render={({ field }) => (
                  <TimePicker value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FlightsEditor() {
  const { fields, append, remove } = useFieldArray<VoyageFormValues, 'flights'>({ name: 'flights' })

  return (
    <Card>
      <CardHeader>
        <CardTitle>항공</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(EMPTY_FLIGHT)}
          >
            <Plus className="h-4 w-4" /> 직접 입력
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            항공편을 직접 입력하세요
          </p>
        ) : (
          fields.map((field, i) => (
            <FlightRow key={field.id} index={i} onRemove={() => remove(i)} />
          ))
        )}
      </CardContent>
    </Card>
  )
}
