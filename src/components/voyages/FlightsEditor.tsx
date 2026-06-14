import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const EMPTY_FLIGHT = {
  flight_no: '', origin: '', destination: '',
  departure_date: '', arrival_date: '',
  departure_time: '', arrival_time: '',
  duration: '', fare: undefined, sort_order: 0,
}

export default function FlightsEditor() {
  const { register } = useFormContext<VoyageFormValues>()
  const { fields, append, remove } = useFieldArray<VoyageFormValues, 'flights'>({ name: 'flights' })

  return (
    <Card>
      <CardHeader>
        <CardTitle>항공</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_FLIGHT)}>
          <Plus className="h-4 w-4" /> 항공편 추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">항공편을 추가하세요</p>
        )}
        {fields.map((field, i) => (
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
                <Input type="date" {...register(`flights.${i}.departure_date`)} />
              </div>
              <div>
                <label className="label">출발 시간</label>
                <Input type="time" {...register(`flights.${i}.departure_time`)} />
              </div>
              <div>
                <label className="label">도착일</label>
                <Input type="date" {...register(`flights.${i}.arrival_date`)} />
              </div>
              <div>
                <label className="label">도착 시간</label>
                <Input type="time" {...register(`flights.${i}.arrival_time`)} />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
