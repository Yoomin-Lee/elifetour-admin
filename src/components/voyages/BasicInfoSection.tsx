import { useFormContext } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const STATUSES = ['미오픈', '판매중', '마감', '출발완료', '취소'] as const

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function BasicInfoSection() {
  const { register, formState: { errors }, watch, setValue } = useFormContext<VoyageFormValues>()

  const cabinTotal = watch('cabin_total')

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="지역 / 상품명 *" error={errors.region?.message}>
            <Input {...register('region')} placeholder="예: 서부지중해" />
          </Field>

          <Field label="상태" error={errors.status?.message}>
            <Select {...register('status')}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>

          <Field label="출발일 *" error={errors.departure_date?.message}>
            <Input type="date" {...register('departure_date')} />
          </Field>

          <Field label="귀국일" error={errors.return_date?.message}>
            <Input type="date" {...register('return_date')} />
          </Field>

          <Field label="항공사" error={errors.airline?.message}>
            <Input {...register('airline')} placeholder="예: 대한항공" />
          </Field>

          <Field label="선사" error={errors.cruise_line?.message}>
            <Input {...register('cruise_line')} placeholder="예: MSC" />
          </Field>

          <Field label="크루즈 선박명" error={errors.ship_name?.message}>
            <Input {...register('ship_name')} placeholder="예: WORLD EUROPA" />
          </Field>

          <Field label="인솔자" error={errors.tour_leader?.message}>
            <Input {...register('tour_leader')} placeholder="미정" />
          </Field>

          <Field label="보유 캐빈" error={errors.cabin_total?.message}>
            <Input
              type="number"
              min={0}
              {...register('cabin_total', {
                onChange: (e) => {
                  const v = Number(e.target.value)
                  setValue('cabin_remaining', v)
                },
              })}
            />
          </Field>

          <Field label="잔여 캐빈" error={errors.cabin_remaining?.message}>
            <Input type="number" min={0} max={cabinTotal || undefined} {...register('cabin_remaining')} />
          </Field>

          <Field label="고객 수" error={errors.customer_count?.message}>
            <Input type="number" min={0} {...register('customer_count')} />
          </Field>

          <Field label="호텔" error={errors.hotel?.message}>
            <Input {...register('hotel')} placeholder="미정" />
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}
