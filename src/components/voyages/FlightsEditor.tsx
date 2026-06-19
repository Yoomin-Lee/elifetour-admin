import { useRef, useState, useEffect } from 'react'
import { useFieldArray, useFormContext, Controller, useWatch } from 'react-hook-form'
import { Plus, Trash2, Upload, Download, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { parseFlightsExcel, downloadFlightsTemplate } from '@/lib/excel'
import { useFlightCalc } from '@/hooks/useFlightCalc'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const EMPTY_FLIGHT = {
  flight_no: '', origin: '', destination: '',
  departure_date: '', arrival_date: '',
  departure_time: '', arrival_time: '',
  duration: '', fare: undefined, sort_order: 0,
}

/** "(ICN)" 형식 또는 단순 공항코드 추출 */
function extractIata(str: string): string {
  const m = str?.match(/\(([A-Z]{3})\)/)
  return m ? m[1] : (str?.trim().toUpperCase() ?? '')
}

/** 항공편 한 행 — 소요시간 자동 계산 포함 */
function FlightRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { register, control, setValue } = useFormContext<VoyageFormValues>()

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

  // 마지막으로 자동 입력한 값 추적 → 동일 값 재입력 방지
  const lastAutoRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isValid || !result) return
    const newText = result.durationText
    if (newText === lastAutoRef.current) return
    setValue(`flights.${index}.duration`, newText, { shouldDirty: true })
    lastAutoRef.current = newText
  }, [result?.durationText, isValid])

  return (
    <div className="relative rounded-lg border border-slate-100 bg-white p-4">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 top-3 rounded p-1 text-slate-300 hover:text-red-500 transition"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <label className="label flex items-center gap-1">
            소요 시간
            {isValid && result && (
              <span className="flex items-center gap-0.5 text-[10px] font-normal text-brand">
                <Zap className="h-2.5 w-2.5" /> 자동
              </span>
            )}
          </label>
          <Input
            {...register(`flights.${index}.duration`)}
            placeholder="자동 계산"
            className={isValid && result ? 'border-brand/40 bg-brand/5' : ''}
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
    </div>
  )
}

export default function FlightsEditor() {
  const { fields, append, remove } = useFieldArray<VoyageFormValues, 'flights'>({ name: 'flights' })
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const rows = await parseFlightsExcel(file)
      rows.forEach(r => append(r))
      setImportMsg(`${rows.length}행 추가됨`)
      setTimeout(() => setImportMsg(null), 3000)
    } catch {
      setImportMsg('파일을 읽을 수 없습니다')
      setTimeout(() => setImportMsg(null), 3000)
    }
    e.target.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>항공</CardTitle>
        <div className="flex items-center gap-2">
          {importMsg && (
            <span className="text-xs text-brand font-medium">{importMsg}</span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => downloadFlightsTemplate()}
            title="엑셀 양식 다운로드"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">양식</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> Excel 불러오기
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(EMPTY_FLIGHT)}
          >
            <Plus className="h-4 w-4" /> 직접 입력
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleExcelImport}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            Excel 파일을 불러오거나 직접 입력하세요
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
