import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { CancellationPolicy } from '@/types/database'

/** 오늘 기준 출발까지 남은 일수 */
function dMinus(departureDate: string): number {
  const dep = new Date(departureDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((dep.getTime() - today.getTime()) / 86400000)
}

function isCurrent(p: CancellationPolicy, d: number): boolean {
  const inStart = p.start_d_minus == null || d <= p.start_d_minus
  const inEnd   = p.end_d_minus   == null || d >= p.end_d_minus
  return inStart && inEnd
}

function dLabel(val: number | null): string {
  return val == null ? '~' : `D-${val}`
}

export default function CancellationCard({
  policies,
  departureDate,
}: {
  policies: CancellationPolicy[]
  departureDate: string
}) {
  const today = dMinus(departureDate)

  return (
    <Card>
      <CardHeader>
        <CardTitle>취소료</CardTitle>
        <span className="text-xs text-slate-400">D-{today > 0 ? today : 0} 기준</span>
      </CardHeader>
      <CardContent className="p-0">
        {policies.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">등록된 취소료가 없습니다</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>구분</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>취소료</TableHead>
                <TableHead>단위</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map(p => {
                const current = isCurrent(p, today)
                return (
                  <TableRow
                    key={p.id}
                    className={cn(current && 'bg-amber-50 font-semibold')}
                  >
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        {current && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        )}
                        {p.category ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500">
                      {dLabel(p.start_d_minus)} ~ {dLabel(p.end_d_minus)}
                    </TableCell>
                    <TableCell className={cn(current && 'text-amber-700')}>
                      {p.fee_description ?? '-'}
                    </TableCell>
                    <TableCell className="text-slate-500">{p.fee_unit ?? '-'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
