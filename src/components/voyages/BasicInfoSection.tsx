import { useFormContext, Controller } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { FieldSelect } from '@/components/ui/field-select'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const STATUSES = ['미오픈', '판매중', '마감', '출발완료', '취소'] as const

const REGIONS = [
  '동북아', '싱가포르', '두바이', '미서부', '알래스카',
  '서부지중해', '동부지중해', '카리브해', '북유럽', '개기일식', '홍콩', '호주',
] as const

const AIRLINES = [
  { value: 'OZ',    label: 'OZ (아시아나항공)' },
  { value: 'KE',    label: 'KE (대한항공)' },
  { value: 'SQ',    label: 'SQ (싱가포르항공)' },
  { value: 'SQ/KE', label: 'SQ/KE (싱가포르/대한)' },
  { value: 'EK/EK', label: 'EK/EK (에미레이트)' },
  { value: 'QR/QR', label: 'QR/QR (카타르항공)' },
  { value: 'LH/LH', label: 'LH/LH (루프트한자)' },
  { value: 'TK/TK', label: 'TK/TK (터키항공)' },
  { value: 'DL/DL', label: 'DL/DL (델타항공)' },
] as const

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
  const { register, control, formState: { errors }, watch, setValue } = useFormContext<VoyageFormValues>()

  const cabinTotal = watch('cabin_total')

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="지역 / 상품명 *" error={errors.region?.message}>
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <FieldSelect
                  value={field.value ?? ''}
                  options={REGIONS as unknown as string[]}
                  onChange={field.onChange}
                  placeholder="상품명 선택"
                />
              )}
            />
          </Field>

          <Field label="상태" error={errors.status?.message}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FieldSelect
                  value={field.value ?? ''}
                  options={STATUSES as unknown as string[]}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>

          <Field label="출발일 *" error={errors.departure_date?.message}>
            <Controller
              name="departure_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="출발일 선택"
                />
              )}
            />
          </Field>

          <Field label="귀국일" error={errors.return_date?.message}>
            <Controller
              name="return_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="귀국일 선택"
                />
              )}
            />
          </Field>

          <Field label="승선일 (크루즈 취소료 기준)" error={errors.boarding_date?.message}>
            <Controller
              name="boarding_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="크루즈 승선일 선택"
                />
              )}
            />
          </Field>

          <Field label="항공사" error={errors.airline?.message}>
            <Controller
              name="airline"
              control={control}
              render={({ field }) => (
                <FieldSelect
                  value={field.value ?? ''}
                  options={AIRLINES as unknown as { value: string; label: string }[]}
                  onChange={field.onChange}
                  placeholder="항공사 선택"
                />
              )}
            />
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
