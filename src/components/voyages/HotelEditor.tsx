import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import { DatePicker } from '@/components/ui/date-picker'
import { AutoTextarea } from '@/components/ui/auto-textarea'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY']

const EMPTY_HOTEL = {
  hotel_name: '', stay_date: '', room_rate: null, currency: 'USD', memo: '', sort_order: 0,
}

function HotelRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { register, control, setValue } = useFormContext<VoyageFormValues>()
  const currency = useWatch({ control, name: `hotels.${index}.currency` }) ?? 'USD'
  const stayDate = useWatch({ control, name: `hotels.${index}.stay_date` }) ?? ''

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1">
          <p className="text-[10px] text-slate-400 mb-0.5">호텔명</p>
          <Input {...register(`hotels.${index}.hotel_name`)} placeholder="호텔명" className="h-8 text-sm" />
        </div>
        <div className="w-32">
          <p className="text-[10px] text-slate-400 mb-0.5">투숙일</p>
          <DatePicker size="sm" value={stayDate} onChange={v => setValue(`hotels.${index}.stay_date`, v)} placeholder="투숙일" />
        </div>
        <div className="w-20">
          <p className="text-[10px] text-slate-400 mb-0.5">통화</p>
          <FieldSelect value={currency} options={CURRENCIES}
            onChange={v => setValue(`hotels.${index}.currency`, v)} className="h-8 text-sm" />
        </div>
        <div className="w-28">
          <p className="text-[10px] text-slate-400 mb-0.5">요금</p>
          <Input type="number" min={0} {...register(`hotels.${index}.room_rate`, { valueAsNumber: true })}
            placeholder="0" className="h-8 text-sm text-right" />
        </div>
        <button type="button" onClick={onRemove}
          className="self-end p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div>
        <p className="text-[10px] text-slate-400 mb-0.5">메모</p>
        <AutoTextarea {...register(`hotels.${index}.memo`)} placeholder="특이사항 (선택)" className="text-sm" />
      </div>
    </div>
  )
}

export default function HotelEditor() {
  const { control } = useFormContext<VoyageFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'hotels' })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>호텔</CardTitle>
        <button
          type="button"
          onClick={() => append(EMPTY_HOTEL)}
          className="flex items-center gap-1 text-xs text-brand font-medium hover:text-brand-dark transition"
        >
          <Plus className="h-3.5 w-3.5" />
          호텔 추가
        </button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-400 text-sm">
            <p>등록된 호텔이 없습니다</p>
            <button
              type="button"
              onClick={() => append(EMPTY_HOTEL)}
              className="text-brand font-medium hover:text-brand-dark transition"
            >
              + 첫 호텔 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <HotelRow key={field.id} index={index} onRemove={() => remove(index)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
