import { useRef, useState } from 'react'
import { useFieldArray, useFormContext, Controller } from 'react-hook-form'
import { Plus, Trash2, Upload, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { parseFlightsExcel, downloadFlightsTemplate } from '@/lib/excel'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const EMPTY_FLIGHT = {
  flight_no: '', origin: '', destination: '',
  departure_date: '', arrival_date: '',
  departure_time: '', arrival_time: '',
  duration: '', fare: undefined, sort_order: 0,
}

export default function FlightsEditor() {
  const { register, control } = useFormContext<VoyageFormValues>()
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
            <div key={field.id} className="relative rounded-lg border border-slate-100 p-4">
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="label">편명</label>
                  <Input {...register(`flights.${i}.flight_no`)} placeholder="KE907" />
                </div>
                <div>
                  <label className="label">출발지</label>
                  <Input {...register(`flights.${i}.origin`)} placeholder="인천(ICN)" />
                </div>
                <div>
                  <label className="label">도착지</label>
                  <Input {...register(`flights.${i}.destination`)} placeholder="바르셀로나(BCN)" />
                </div>
                <div>
                  <label className="label">소요 시간</label>
                  <Input {...register(`flights.${i}.duration`)} placeholder="12h 40m" />
                </div>
                <div>
                  <label className="label">출발일</label>
                  <Controller
                    name={`flights.${i}.departure_date`}
                    control={control}
                    render={({ field }) => (
                      <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder="출발일" />
                    )}
                  />
                </div>
                <div>
                  <label className="label">출발 시간</label>
                  <Controller
                    name={`flights.${i}.departure_time`}
                    control={control}
                    render={({ field }) => (
                      <TimePicker value={field.value ?? ''} onChange={field.onChange} />
                    )}
                  />
                </div>
                <div>
                  <label className="label">도착일</label>
                  <Controller
                    name={`flights.${i}.arrival_date`}
                    control={control}
                    render={({ field }) => (
                      <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder="도착일" />
                    )}
                  />
                </div>
                <div>
                  <label className="label">도착 시간</label>
                  <Controller
                    name={`flights.${i}.arrival_time`}
                    control={control}
                    render={({ field }) => (
                      <TimePicker value={field.value ?? ''} onChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
