import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { fetchAllVoyageFlights } from '@/lib/queries/voyageFlights'
import { getAirportTimezone } from '@/lib/utils/flightCalc'
import { voyageTitle } from '@/types/database'

function localDatetime(isoUtc: string, airportCode: string) {
  const tz = getAirportTimezone(airportCode)
  const zoned = toZonedTime(new Date(isoUtc), tz)
  return { date: format(zoned, 'MM/dd'), time: format(zoned, 'HH:mm') }
}

function formatFare(fare: number | null, currency: string): string {
  if (!fare) return '—'
  const amount = fare.toLocaleString()
  if (currency === 'KRW') return `₩${amount}`
  if (currency === 'USD') return `$${amount}`
  if (currency === 'EUR') return `€${amount}`
  return `${amount} ${currency}`
}

export default function FlightsTab() {
  const [filter, setFilter] = useState('')
  const { data = [], isLoading } = useQuery({
    queryKey: ['all-voyage-flights'],
    queryFn: fetchAllVoyageFlights,
  })

  const filtered = data.filter(r =>
    !filter ||
    (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
    r.flight_num.toLowerCase().includes(filter.toLowerCase()) ||
    r.dep_airport.toLowerCase().includes(filter.toLowerCase()) ||
    r.arr_airport.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">항공</h1>
          <p className="text-sm text-slate-400">전체 {data.length}편 · 현지 시각 기준, DST 반영</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="행사명·편명·공항코드 검색"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[1000px] w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">편명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-14">출발지</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-14">도착지</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16">출발일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-14">출발</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16">도착일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-14">도착</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">비행시간</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-24">항공요금</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
            )}
            {filtered.map(r => {
              const dep = localDatetime(r.dep_datetime, r.dep_airport)
              const arr = localDatetime(r.arr_datetime, r.arr_airport)
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                    {r.voyages ? voyageTitle(r.voyages) : '—'}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-700">{r.flight_num}</td>
                  <td className="px-3 py-2 font-mono text-slate-600">{r.dep_airport}</td>
                  <td className="px-3 py-2 font-mono text-slate-600">{r.arr_airport}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{dep.date}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{dep.time}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{arr.date}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{arr.time}</td>
                  <td className="px-3 py-2 text-slate-600">{r.flight_duration ?? '—'}</td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {formatFare(r.flight_fare, r.currency_code)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
