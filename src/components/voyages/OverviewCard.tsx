import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatDate, calcNights } from '@/lib/utils'
import { voyageTitle } from '@/types/database'
import { updateVoyage } from '@/lib/queries/voyages'
import type { Voyage, VoyageStatus } from '@/types/database'

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
  cruise_line: string
  ship_name: string
  departure_date: string
  return_date: string
  cabin_total: string
  cabin_remaining: string
  customer_count: string
  tour_leader: string
  hotel: string
}

function toForm(v: Voyage): Form {
  return {
    region: v.region,
    status: v.status,
    airline: v.airline ?? '',
    cruise_line: v.cruise_line ?? '',
    ship_name: v.ship_name ?? '',
    departure_date: v.departure_date,
    return_date: v.return_date ?? '',
    cabin_total: String(v.cabin_total ?? ''),
    cabin_remaining: String(v.cabin_remaining ?? ''),
    customer_count: String(v.customer_count ?? ''),
    tour_leader: v.tour_leader ?? '',
    hotel: v.hotel ?? '',
  }
}

export default function OverviewCard({ voyage, canWrite = true }: { voyage: Voyage; canWrite?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [f, setF] = useState<Form>(toForm(voyage))
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => updateVoyage(voyage.id, {
      region: f.region,
      status: f.status,
      airline: f.airline || null,
      cruise_line: f.cruise_line || null,
      ship_name: f.ship_name || null,
      departure_date: f.departure_date,
      return_date: f.return_date || null,
      cabin_total: Number(f.cabin_total) || 0,
      cabin_remaining: Number(f.cabin_remaining) || 0,
      customer_count: Number(f.customer_count) || 0,
      tour_leader: f.tour_leader || null,
      hotel: f.hotel || null,
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
            <CardTitle>개요</CardTitle>
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
              <Input value={f.region} onChange={set('region')} className="h-7 text-sm" />
            </ERow>
            <ERow label="상태">
              <Select value={f.status} onChange={set('status')} className="h-7 py-0 text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </ERow>
            <ERow label="출발일">
              <Input type="date" value={f.departure_date} onChange={set('departure_date')} className="h-7 text-sm" />
            </ERow>
            <ERow label="귀국일">
              <Input type="date" value={f.return_date} onChange={set('return_date')} className="h-7 text-sm" />
            </ERow>
            <ERow label="항공사">
              <Input value={f.airline} onChange={set('airline')} placeholder="대한항공" className="h-7 text-sm" />
            </ERow>
            <ERow label="선사">
              <Input value={f.cruise_line} onChange={set('cruise_line')} placeholder="MSC" className="h-7 text-sm" />
            </ERow>
            <ERow label="크루즈">
              <Input value={f.ship_name} onChange={set('ship_name')} placeholder="WORLD EUROPA" className="h-7 text-sm" />
            </ERow>
            <ERow label="보유 캐빈">
              <Input type="number" min={0} value={f.cabin_total} onChange={set('cabin_total')} className="h-7 text-sm" />
            </ERow>
            <ERow label="잔여 캐빈">
              <Input type="number" min={0} value={f.cabin_remaining} onChange={set('cabin_remaining')} className="h-7 text-sm" />
            </ERow>
            <ERow label="고객 수">
              <Input type="number" min={0} value={f.customer_count} onChange={set('customer_count')} className="h-7 text-sm" />
            </ERow>
            <ERow label="인솔자">
              <Input value={f.tour_leader} onChange={set('tour_leader')} placeholder="미정" className="h-7 text-sm" />
            </ERow>
            <ERow label="호텔">
              <Input value={f.hotel} onChange={set('hotel')} placeholder="미정" className="h-7 text-sm" />
            </ERow>
          </dl>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>개요</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[voyage.status]}>{voyage.status}</Badge>
          {canWrite && (
            <button
              onClick={() => { setF(toForm(voyage)); setEditing(true) }}
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
          <Row label="귀국일"    value={formatDate(voyage.return_date)} />
          <Row label="여행 기간" value={calcNights(voyage.departure_date, voyage.return_date)} />
          <Row label="항공사"    value={voyage.airline} />
          <Row label="선사"      value={voyage.cruise_line} />
          <Row label="크루즈"    value={voyage.ship_name} />
          <Row label="보유 캐빈" value={voyage.cabin_total ? `${voyage.cabin_total}개` : '-'} />
          <Row label="잔여 캐빈" value={
            voyage.cabin_remaining != null
              ? <span className={voyage.cabin_remaining === 0 ? 'text-red-500' : ''}>{voyage.cabin_remaining}개</span>
              : '-'
          } />
          <Row label="고객 수"   value={voyage.customer_count ? `${voyage.customer_count}명` : '-'} />
          <Row label="인솔자"    value={voyage.tour_leader} />
          <Row label="호텔"      value={voyage.hotel} />
        </dl>
      </CardContent>
    </Card>
  )
}
