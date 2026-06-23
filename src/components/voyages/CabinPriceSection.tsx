import { Fragment } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import { SelectOrInput } from '@/components/ui/select-or-input'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const CABIN_GRADES = ['4D', '2D', 'BA2', 'BR1', '3D(FIT)', '4U', 'BM1', 'VD', '1D', '3D', 'VC', 'VE']
const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY']
const AGENTS = ['TMK', 'COSTA', 'ONLINE', 'DONGBO', 'VASCO', 'FLORENCE']
const SYM: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥' }
const PRICE_FIELDS = ['ccf', 'nccf', 'tax', 'tip'] as const

const EMPTY_GRADE = {
  grade: '', total: 0, reserved: 0,
  ccf: null, nccf: null, tax: null, tip: null,
  currency: 'USD', agent: '',
}

function formatPrice(ccf: unknown, nccf: unknown, tax: unknown, tip: unknown, currency: string): string {
  const sum = (Number(ccf) || 0) + (Number(nccf) || 0) + (Number(tax) || 0) + (Number(tip) || 0)
  if (!sum) return '—'
  const prefix = SYM[currency] ?? (currency + ' ')
  return prefix + sum.toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
}

function GradeRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { register, control, setValue } = useFormContext<VoyageFormValues>()
  const values = useWatch({ control, name: `cabin_grades.${index}` })
  const currency = values?.currency ?? 'USD'
  const grade = values?.grade ?? ''
  const agent = values?.agent ?? ''

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
      {/* 1행: 등급 · 보유 · 에이전트 · 통화 · 삭제 */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-36">
          <p className="text-[10px] text-slate-400 mb-0.5">캐빈 등급</p>
          <SelectOrInput
            value={grade}
            options={CABIN_GRADES}
            onChange={v => setValue(`cabin_grades.${index}.grade`, v)}
            placeholder="등급 선택"
          />
        </div>
        <div className="w-20">
          <p className="text-[10px] text-slate-400 mb-0.5">보유</p>
          <Input
            type="number" min={0}
            {...register(`cabin_grades.${index}.total`)}
            placeholder="0"
            className="h-7 text-sm text-right"
          />
        </div>
        <div className="w-32">
          <p className="text-[10px] text-slate-400 mb-0.5">에이전트</p>
          <SelectOrInput
            value={agent}
            options={AGENTS}
            onChange={v => setValue(`cabin_grades.${index}.agent`, v)}
            placeholder="에이전트"
          />
        </div>
        <div className="flex-1" />
        <div className="w-20">
          <p className="text-[10px] text-slate-400 mb-0.5">통화</p>
          <FieldSelect
            value={currency}
            options={CURRENCIES}
            onChange={v => setValue(`cabin_grades.${index}.currency`, v)}
            className="h-7 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="self-end p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* 2행: CCF + NCCF + TAX + TIP = 캐빈가 */}
      <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-slate-200">
        {PRICE_FIELDS.map((f, i) => (
          <Fragment key={f}>
            <div className="w-20">
              <p className="text-[10px] text-slate-400 mb-0.5">{f.toUpperCase()}</p>
              <Input
                type="number" min={0}
                {...register(`cabin_grades.${index}.${f}`)}
                placeholder="—"
                className="h-7 text-sm text-right"
              />
            </div>
            {i < 3 && <span className="text-slate-400 pb-1 text-sm">+</span>}
          </Fragment>
        ))}
        <span className="text-slate-400 pb-1 text-sm">=</span>
        <div className="w-28">
          <p className="text-[10px] text-brand mb-0.5">캐빈가</p>
          <div className="h-7 flex items-center justify-end pr-3 text-sm font-semibold text-brand border border-slate-200 rounded-lg bg-white">
            {formatPrice(values?.ccf, values?.nccf, values?.tax, values?.tip, currency)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CabinPriceSection() {
  const { control } = useFormContext<VoyageFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'cabin_grades' })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>캐빈가</CardTitle>
        <button
          type="button"
          onClick={() => append(EMPTY_GRADE)}
          className="flex items-center gap-1 text-xs text-brand font-medium hover:text-brand-dark transition"
        >
          <Plus className="h-3.5 w-3.5" />
          등급 추가
        </button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-400 text-sm">
            <p>등록된 캐빈 등급이 없습니다</p>
            <button
              type="button"
              onClick={() => append(EMPTY_GRADE)}
              className="text-brand font-medium hover:text-brand-dark transition"
            >
              + 첫 등급 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <GradeRow key={field.id} index={index} onRemove={() => remove(index)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
