import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'GBP']
import { Button } from '@/components/ui/button'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const EMPTY_POLICY = {
  category: '', start_d_minus: undefined, end_d_minus: undefined,
  fee_description: '', fee_type: undefined, fee_value: undefined,
  fee_unit: '', note: '', sort_order: 0,
}

export default function CancellationEditor() {
  const { register } = useFormContext<VoyageFormValues>()
  const { fields, append, remove } = useFieldArray<VoyageFormValues, 'policies'>({ name: 'policies' })

  return (
    <Card>
      <CardHeader>
        <CardTitle>취소료</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_POLICY)}>
          <Plus className="h-4 w-4" /> 구간 추가
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">취소료 구간을 추가하세요</p>
        )}
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-start rounded-lg border border-slate-100 p-3">
              <span className="mt-2 w-5 shrink-0 text-center text-xs text-slate-400">{i + 1}</span>
              <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <label className="label">구분</label>
                  <Input {...register(`policies.${i}.category`)} placeholder="크루즈" />
                </div>
                <div>
                  <label className="label">시작 D-</label>
                  <Input
                    type="number"
                    {...register(`policies.${i}.start_d_minus`)}
                    placeholder="없음이면 빈칸"
                  />
                </div>
                <div>
                  <label className="label">종료 D-</label>
                  <Input type="number" {...register(`policies.${i}.end_d_minus`)} placeholder="예: 90" />
                </div>
                <div>
                  <label className="label">통화</label>
                  <div className="relative">
                    <Select {...register(`policies.${i}.fee_unit`)} className="appearance-none pr-7">
                      <option value="">-</option>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="label">취소료 설명</label>
                  <Input {...register(`policies.${i}.fee_description`)} placeholder="예: 크루즈요금 25%" />
                </div>
                <div>
                  <label className="label">유형</label>
                  <div className="relative">
                    <Select {...register(`policies.${i}.fee_type`)} className="appearance-none pr-7">
                      <option value="">-</option>
                      <option value="percent">퍼센트</option>
                      <option value="fixed">정액</option>
                      <option value="free">무료</option>
                    </Select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="label">값</label>
                  <Input type="number" {...register(`policies.${i}.fee_value`)} placeholder="예: 25" />
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
