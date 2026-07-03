import { useState, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import { SelectOrInput } from '@/components/ui/select-or-input'
import { DatePicker } from '@/components/ui/date-picker'
import { formatDate, calcNights } from '@/lib/utils'
import { voyageTitle } from '@/types/database'
import { CruiseLineBadge } from '@/components/ui/cruise-line-badge'
import { updateVoyage } from '@/lib/queries/voyages'
import { fetchRegionOptions } from '@/lib/queries/regionOptions'
import { fetchAirlineOptions } from '@/lib/queries/airlineOptions'
import type { Voyage, VoyageStatus, ItineraryDay } from '@/types/database'

const stripParens = (v: string) => v.replace(/\s*\(.*\)\s*$/, '')

const STATUS_VARIANT: Record<VoyageStatus, 'default' | 'success' | 'destructive' | 'warning' | 'info' | 'outline'> = {
  '미오픈':    'default',
  '판매중':    'success',
  '마감':      'warning',
  '출발완료':  'info',
  '취소':      'destructive',
}

const STATUSES: VoyageStatus[] = ['미오픈', '판매중', '마감', '출발완료', '취소']



function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-slate-50 last:border-0">
      <dt className="w-28 shrink-0 text-xs text-slate-400 pt-0.5">{label}</dt>
      <dd className="text-sm text-slate-800 font-medium flex-1">{value ?? '-'}</dd>
    </div>
  )
}

function ERow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1 border-b border-slate-50 last:border-0 items-center">
      <dt className="w-28 shrink-0 text-xs text-slate-400">{label}</dt>
      <dd className="flex-1">{children}</dd>
    </div>
  )
}

type Form = {
  region: string
  status: VoyageStatus
  airline: string
  airline_return: string
  cruise_line: string
  ship_name: string
  departure_date: string
  return_date: string
  boarding_date: string
  duration: string
  customer_count: string
  tour_leader: string
  hotel: string
  product_price: string
}

function toForm(v: Voyage): Form {
  return {
    region: v.region,
    status: v.status,
    airline: v.airline ?? '',
    airline_return: v.airline_return ?? '',
    cruise_line: v.cruise_line ?? '',
    ship_name: v.ship_name ?? '',
    departure_date: v.departure_date,
    return_date: v.return_date ?? '',
    boarding_date: v.boarding_date ?? '',
    duration: v.duration ?? '',
    customer_count: String(v.customer_count ?? ''),
    tour_leader: v.tour_leader ?? '',
    hotel: v.hotel ?? '',
    product_price: v.product_price != null ? v.product_price.toLocaleString() : '',
  }
}

function detectBoardingDate(itinerary: ItineraryDay[]): string | null {
  const sorted = [...itinerary].sort((a, b) => a.sort_order - b.sort_order)
  const found = sorted.find(d => (d.summary ?? '').includes('승선'))
  return found?.date ?? null
}

export default function OverviewCard({
  voyage,
  itinerary = [],
  canWrite = true,
}: {
  voyage: Voyage
  itinerary?: ItineraryDay[]
  canWrite?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [f, setF] = useState<Form>(toForm(voyage))
  const [nights, setNights] = useState('')
  const [days, setDays]     = useState('')
  const daysRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  function parseDuration(dur: string) {
    const m = dur.match(/^(\d+)박\s*(\d+)일$/)
    return m ? { nights: m[1], days: m[2] } : { nights: '', days: '' }
  }

  function handleNightsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)
    setNights(val)
    setF(p => ({ ...p, duration: val || days ? `${val || 0}박 ${days || 0}일` : '' }))
    if (val.length >= 2) daysRef.current?.focus()
  }

  function handleDaysChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)
    setDays(val)
    setF(p => ({ ...p, duration: nights || val ? `${nights || 0}박 ${val || 0}일` : '' }))
  }

  const { data: regionOptions = [] } = useQuery({
    queryKey: ['region-options'],
    queryFn: fetchRegionOptions,
    select: data => data.map(r => r.label),
  })
  const { data: airlineOptions = [] } = useQuery({
    queryKey: ['airline-options'],
    queryFn: fetchAirlineOptions,
    select: data => data.map(r => r.label),
  })

  const mut = useMutation({
    mutationFn: () => updateVoyage(voyage.id, {
      region: f.region,
      status: f.status,
      airline: f.airline || null,
      airline_return: f.airline_return || null,
      cruise_line: f.cruise_line || null,
      ship_name: f.ship_name || null,
      departure_date: f.departure_date,
      return_date: f.return_date || null,
      boarding_date: f.boarding_date || null,
      duration: f.duration || null,
      customer_count: Number(f.customer_count) || 0,
      tour_leader: f.tour_leader || null,
      hotel: f.hotel || null,
      product_price: f.product_price !== '' ? Number(f.product_price.replace(/,/g, '')) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voyages'] })
      setEditing(false)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  function set(field: keyof Form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF(prev => ({ ...prev, [field]: e.target.value }))
  }

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>기본 정보</CardTitle>
            <Badge variant={STATUS_VARIANT[f.status]}>{f.status}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-50 transition disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />{mut.isPending ? '저장 중…' : '저장'}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={mut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-400 hover:bg-slate-100 transition"
            >
              <X className="h-3.5 w-3.5" />취소
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {mut.isError && (
            <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
          )}
          <dl>
            <ERow label="지역/상품명">
              <SelectOrInput
                value={f.region}
                options={regionOptions}
                onChange={v => setF(p => ({ ...p, region: v }))}
                className="h-7 text-sm"
              />
            </ERow>
            <ERow label="상태">
              <FieldSelect
                value={f.status}
                options={STATUSES}
                onChange={v => setF(p => ({ ...p, status: v as VoyageStatus }))}
                className="h-7 text-sm"
              />
            </ERow>
            <ERow label="출발일">
              <DatePicker value={f.departure_date} onChange={v => setF(p => ({ ...p, departure_date: v }))} placeholder="출발일" />
            </ERow>
            <ERow label="승선일">
              <div className="flex items-center gap-1.5">
                <DatePicker value={f.boarding_date} onChange={v => setF(p => ({ ...p, boarding_date: v }))} placeholder="크루즈 승선일" />
                {(() => {
                  const detected = detectBoardingDate(itinerary)
                  if (!detected) return null
                  const isSame = detected === f.boarding_date
                  return (
                    <button
                      type="button"
                      onClick={() => setF(p => ({ ...p, boarding_date: detected }))}
                      title={`기항지 '${itinerary.find(d => d.date === detected)?.port ?? ''}' 날짜로 입력`}
                      className={`shrink-0 rounded px-2 py-1 text-[11px] font-medium transition whitespace-nowrap ${
                        isSame
                          ? 'bg-green-50 text-green-600 cursor-default'
                          : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                      }`}
                    >
                      {isSame ? '✓ 일치' : `기항지 자동입력 (${formatDate(detected)})`}
                    </button>
                  )
                })()}
              </div>
            </ERow>
            <ERow label="귀국일">
              <DatePicker value={f.return_date} onChange={v => setF(p => ({ ...p, return_date: v }))} placeholder="귀국일" />
            </ERow>
            <ERow label="여행 기간">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  value={nights}
                  onChange={handleNightsChange}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); daysRef.current?.focus() } }}
                  maxLength={2}
                  placeholder="0"
                  className="w-10 h-7 rounded border border-slate-200 px-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <span className="text-xs text-slate-500 shrink-0">박</span>
                <input
                  ref={daysRef}
                  type="text"
                  inputMode="numeric"
                  value={days}
                  onChange={handleDaysChange}
                  maxLength={2}
                  placeholder="0"
                  className="w-10 h-7 rounded border border-slate-200 px-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <span className="text-xs text-slate-500 shrink-0">일</span>
              </div>
            </ERow>
            <ERow label="항공사">
              <SelectOrInput
                value={f.airline}
                options={airlineOptions}
                onChange={v => setF(p => ({ ...p, airline: stripParens(v) }))}
                className="h-7 text-sm"
              />
            </ERow>
            <ERow label="항공사">
              <SelectOrInput
                value={f.airline_return}
                options={airlineOptions}
                onChange={v => setF(p => ({ ...p, airline_return: stripParens(v) }))}
                className="h-7 text-sm"
              />
            </ERow>
            <ERow label="선사">
              <Input value={f.cruise_line} onChange={set('cruise_line')} placeholder="MSC" className="h-7 text-sm" />
            </ERow>
            <ERow label="크루즈">
              <Input value={f.ship_name} onChange={set('ship_name')} placeholder="WORLD EUROPA" className="h-7 text-sm" />
            </ERow>
            <ERow label="고객 수">
              <Input type="number" min={0} value={f.customer_count} onChange={set('customer_count')} className="h-7 text-sm" />
            </ERow>
            <ERow label="인솔자">
              <Input value={f.tour_leader} onChange={set('tour_leader')} placeholder="미정" className="h-7 text-sm" />
            </ERow>
            <ERow label="상품가">
              <div className="flex items-center gap-1.5">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={f.product_price}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    setF(p => ({ ...p, product_price: raw ? Number(raw).toLocaleString() : '' }))
                  }}
                  placeholder="0"
                  className="h-7 text-sm"
                />
                <span className="text-xs text-slate-400 shrink-0">원</span>
              </div>
            </ERow>
            <div className="flex gap-2 py-1 border-b border-slate-50 last:border-0 items-start">
              <dt className="w-28 shrink-0 text-xs text-slate-400 pt-1.5">비고</dt>
              <dd className="flex-1">
                <textarea
                  value={f.hotel}
                  onChange={e => setF(p => ({ ...p, hotel: e.target.value }))}
                  onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }}
                  placeholder="미정"
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1 resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-brand min-h-[52px]"
                />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[voyage.status]}>{voyage.status}</Badge>
          {canWrite && (
            <button
              onClick={() => {
                const form = toForm(voyage)
                setF(form)
                const { nights: n, days: d } = parseDuration(form.duration)
                setNights(n); setDays(d)
                setEditing(true)
              }}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="편집"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <dl>
          <Row label="행사명"    value={voyageTitle(voyage)} />
          <Row label="출발일"    value={formatDate(voyage.departure_date)} />
          <Row label="승선일"    value={voyage.boarding_date ? formatDate(voyage.boarding_date) : '-'} />
          <Row label="귀국일"    value={formatDate(voyage.return_date)} />
          <Row label="여행 기간" value={voyage.duration || calcNights(voyage.departure_date, voyage.return_date)} />
          <Row label="항공사" value={voyage.airline} />
          <Row label="항공사" value={voyage.airline_return} />
          <Row label="선사"      value={<CruiseLineBadge value={voyage.cruise_line} />} />
          <Row label="크루즈"    value={voyage.ship_name} />
          <Row label="고객 수"   value={voyage.customer_count ? `${voyage.customer_count}명` : '-'} />
          <Row label="인솔자"    value={voyage.tour_leader} />
          <Row label="상품가"    value={voyage.product_price != null ? `${voyage.product_price.toLocaleString()}원` : '-'} />
          <Row label="비고"      value={voyage.hotel ? <span className="whitespace-pre-wrap">{voyage.hotel}</span> : undefined} />
        </dl>
      </CardContent>
    </Card>
  )
}
