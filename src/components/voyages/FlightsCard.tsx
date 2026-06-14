import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatDate, formatTime } from '@/lib/utils'
import type { Flight } from '@/types/database'

export default function FlightsCard({ flights }: { flights: Flight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>항공</CardTitle>
        <span className="text-xs text-slate-400">{flights.length}편</span>
      </CardHeader>
      <CardContent className="p-0">
        {flights.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">등록된 항공편이 없습니다</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>편명</TableHead>
                <TableHead>출발지</TableHead>
                <TableHead>도착지</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>출발</TableHead>
                <TableHead>도착</TableHead>
                <TableHead>소요</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flights.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono font-medium text-brand">{f.flight_no ?? '-'}</TableCell>
                  <TableCell>{f.origin ?? '-'}</TableCell>
                  <TableCell>{f.destination ?? '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(f.departure_date)}</TableCell>
                  <TableCell>{formatTime(f.departure_time)}</TableCell>
                  <TableCell>{formatTime(f.arrival_time)}</TableCell>
                  <TableCell className="text-slate-500">{f.duration ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
