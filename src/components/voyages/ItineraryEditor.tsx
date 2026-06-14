import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const EMPTY_DAY = {
  date: '', port: '', arrival_time: '', departure_time: '', summary: '', sort_order: 0,
}

export default function ItineraryEditor() {
  const { register, formState: { errors } } = useFormContext<VoyageFormValues>()
  const { fields, append, remove } = useFieldArray<VoyageFormValues, 'itinerary'>({ name: 'itinerary' })

  return (
    <Card>
      <CardHeader>
        <CardTitle>기항지 일정</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_DAY)}>
          <Plus className="h-4 w-4" /> 일정 추가
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">기항지 일정을 추가하세요</p>
        )}
        <div className="space-y-2">
          {fields.map((field, i) => {
            const dayErrors = errors.itinerary?.[i]
            return (
              <div key={field.id} className="flex gap-2 items-start rounded-lg border border-slate-100 p-3">
                <span className="mt-2 w-5 shrink-0 text-center text-xs text-slate-400">{i + 1}</span>
                <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-5">
                  <div>
                    <label className="label">날짜 *</label>
                    <Input type="date" {...register(`itinerary.${i}.date`)} />
                    {dayErrors?.date && <p className="mt-0.5 text-xs text-red-500">{dayErrors.date.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">기항지 *</label>
                    <Input {...register(`itinerary.${i}.port`)} placeholder="바르셀로나 (스페인)" />
                    {dayErrors?.port && <p className="mt-0.5 text-xs text-red-500">{dayErrors.port.message}</p>}
                  </div>
                  <div>
                    <label className="label">도착</label>
                    <Input type="time" {...register(`itinerary.${i}.arrival_time`)} />
                  </div>
                  <div>
                    <label className="label">출발</label>
                    <Input type="time" {...register(`itinerary.${i}.departure_time`)} />
                  </div>
                  <div className="col-span-2 sm:col-span-5">
                    <label className="label">비고</label>
                    <Input {...register(`itinerary.${i}.summary`)} placeholder="주요 관광지, 이동 정보 등" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="mt-2 shrink-0 rounded p-1 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
