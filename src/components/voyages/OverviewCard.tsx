import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, calcNights } from '@/lib/utils'
import { voyageTitle } from '@/types/database'
import type { Voyage, VoyageStatus } from '@/types/database'

const STATUS_VARIANT: Record<VoyageStatus, 'default' | 'success' | 'destructive' | 'warning' | 'info' | 'outline'> = {
  '미오픈':    'default',
  '판매중':    'success',
  '마감':      'warning',
  '출발완료':  'info',
  '취소':      'destructive',
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-slate-50 last:border-0">
      <dt className="w-28 shrink-0 text-xs text-slate-400 pt-0.5">{label}</dt>
      <dd className="text-sm text-slate-800 font-medium flex-1">{value ?? '-'}</dd>
    </div>
  )
}

export default function OverviewCard({ voyage }: { voyage: Voyage }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>개요</CardTitle>
        <Badge variant={STATUS_VARIANT[voyage.status]}>{voyage.status}</Badge>
      </CardHeader>
      <CardContent>
        <dl>
          <Row label="행사명"       value={voyageTitle(voyage)} />
          <Row label="출발일"       value={formatDate(voyage.departure_date)} />
          <Row label="귀국일"       value={formatDate(voyage.return_date)} />
          <Row label="여행 기간"    value={calcNights(voyage.departure_date, voyage.return_date)} />
          <Row label="항공사"       value={voyage.airline} />
          <Row label="선사"         value={voyage.cruise_line} />
          <Row label="크루즈"       value={voyage.ship_name} />
          <Row label="보유 캐빈"    value={voyage.cabin_total ? `${voyage.cabin_total}개` : '-'} />
          <Row label="잔여 캐빈"    value={
            voyage.cabin_remaining != null
              ? <span className={voyage.cabin_remaining === 0 ? 'text-red-500' : ''}>{voyage.cabin_remaining}개</span>
              : '-'
          } />
          <Row label="고객 수"      value={voyage.customer_count ? `${voyage.customer_count}명` : '-'} />
          <Row label="인솔자"       value={voyage.tour_leader} />
          <Row label="호텔"         value={voyage.hotel} />
        </dl>
      </CardContent>
    </Card>
  )
}
