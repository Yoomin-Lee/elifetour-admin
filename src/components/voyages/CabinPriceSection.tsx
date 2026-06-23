import { Fragment } from 'react'
import { useFormContext } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const CABIN_GRADES = ['4D', '2D', 'BA2', 'BR1', '3D(FIT)', '4U', 'BM1', 'VD', '1D', '3D', 'VC', 'VE']
const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY']
const SYM: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥' }

function formatTotal(ccf: unknown, nccf: unknown, tax: unknown, tip: unknown, currency: string): string {
  const sum = (Number(ccf) || 0) + (Number(nccf) || 0) + (Number(tax) || 0) + (Number(tip) || 0)
  if (!sum) return '—'
  const prefix = SYM[currency] ?? (currency + ' ')
  return prefix + sum.toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
}

const FIELDS = [
  { name: 'cabin_ccf',  label: 'CCF' },
  { name: 'cabin_nccf', label: 'NCCF' },
  { name: 'cabin_tax',  label: 'TAX' },
  { name: 'cabin_tip',  label: 'TIP' },
] as const

export default function CabinPriceSection() {
  const { register, watch, setValue } = useFormContext<VoyageFormValues>()
  const [ccf, nccf, tax, tip, currency, grade] = watch([
    'cabin_ccf', 'cabin_nccf', 'cabin_tax', 'cabin_tip', 'cabin_currency', 'cabin_grade',
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>캐빈가</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 등급 */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-36">
              <label className="label">캐빈 등급</label>
              <FieldSelect
                value={grade ?? ''}
                options={CABIN_GRADES}
                onChange={v => setValue('cabin_grade', v)}
                placeholder="등급 선택"
              />
            </div>
          </div>

          {/* CCF + NCCF + TAX + TIP = 총합 */}
          <div>
            <label className="label">
              요금 계산식 <span className="font-normal text-slate-400">CCF + NCCF + TAX + TIP</span>
            </label>
            <div className="flex flex-wrap items-end gap-2">
              {FIELDS.map(({ name, label }, idx) => (
                <Fragment key={name}>
                  <div className="w-24">
                    <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
                    <Input
                      type="number"
                      min={0}
                      {...register(name)}
                      placeholder="—"
                      className="text-right"
                    />
                  </div>
                  {idx < 3 && <span className="text-slate-400 pb-1">+</span>}
                </Fragment>
              ))}
              <span className="text-slate-400 pb-1">=</span>
              <div className="w-28">
                <p className="text-[10px] text-brand mb-0.5">캐빈가 총합</p>
                <div className="h-9 flex items-center justify-end pr-3 text-sm font-semibold text-brand border border-slate-200 rounded-lg bg-slate-50">
                  {formatTotal(ccf, nccf, tax, tip, currency ?? 'USD')}
                </div>
              </div>
              <div className="w-24">
                <p className="text-[10px] text-slate-400 mb-0.5">통화</p>
                <FieldSelect
                  value={currency ?? 'USD'}
                  options={CURRENCIES}
                  onChange={v => setValue('cabin_currency', v)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
