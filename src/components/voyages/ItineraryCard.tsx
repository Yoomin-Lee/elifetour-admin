import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatDate, formatTime } from '@/lib/utils'
import type { ItineraryDay } from '@/types/database'

const SEA_DAY = '해상'

export default function ItineraryCard({ days }: { days: ItineraryDay[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>기항지 일정</CardTitle>
        <span className="text-xs text-slate-400">{days.length}일</span>
      </CardHeader>
      <CardContent className="p-0">
        {days.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">등록된 일정이 없습니다</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>기항지</TableHead>
                <TableHead>도착</TableHead>
                <TableHead>출발</TableHead>
                <TableHead>비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((d, i) => {
                const isSea = d.port.includes(SEA_DAY)
                return (
                  <TableRow
                    key={d.id}
                    className={isSea ? 'bg-slate-50/80 text-slate-400' : ''}
                  >
                    <TableCell className="text-slate-400 text-xs">{i + 1}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{formatDate(d.date)}</TableCell>
                    <TableCell className={isSea ? 'italic' : 'font-medium'}>{d.port}</TableCell>
                    <TableCell>{formatTime(d.arrival_time)}</TableCell>
                    <TableCell>{formatTime(d.departure_time)}</TableCell>
                    <TableCell className="text-slate-500 text-xs max-w-48 truncate">{d.summary ?? ''}</TableCell>
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
