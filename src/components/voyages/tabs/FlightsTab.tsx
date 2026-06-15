import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import {
  fetchAllVoyageFlights,
  insertVoyageFlight,
  updateVoyageFlight,
  deleteVoyageFlight,
} from '@/lib/queries/voyageFlights'
import { fetchVoyages } from '@/lib/queries/voyages'
import { getAirportTimezone } from '@/lib/utils/flightCalc'
import { voyageTitle } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { VoyageFlight } from '@/lib/queries/voyageFlights'

const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'GBP'] as const

function localDt(isoUtc: string, airportCode: string) {
  const tz = getAirportTimezone(airportCode)
  const zoned = toZonedTime(new Date(isoUtc), tz)
  return { display: { date: format(zoned, 'MM/dd'), time: format(zoned, 'HH:mm') }, form: { date: format(zoned, 'yyyy-MM-dd'), time: format(zoned, 'HH:mm') } }
}

function formatFare(fare: number | null, currency: string): string {
  if (!fare) return '—'
  const amount = fare.toLocaleString()
  if (currency === 'KRW') return `₩${amount}`
  if (currency === 'USD') return `$${amount}`
  if (currency === 'EUR') return `€${amount}`
  return `${amount} ${currency}`
}

type FlightForm = {
  voyage_id: string
  flight_num: string
  dep_airport: string
  arr_airport: string
  departureDate: string
  departureTime: string
  arrivalDate: string
  arrivalTime: string
  flight_fare: string
  currency_code: string
  pnr: string
}

const EMPTY_FORM: FlightForm = {
  voyage_id: '', flight_num: '', dep_airport: '', arr_airport: '',
  departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '',
  flight_fare: '', currency_code: 'KRW', pnr: '',
}

function initEditForm(r: VoyageFlight): FlightForm {
  const dep = localDt(r.dep_datetime, r.dep_airport)
  const arr = localDt(r.arr_datetime, r.arr_airport)
  return {
    voyage_id: r.voyage_id,
    flight_num: r.flight_num,
    dep_airport: r.dep_airport,
    arr_airport: r.arr_airport,
    departureDate: dep.form.date,
    departureTime: dep.form.time,
    arrivalDate: arr.form.date,
    arrivalTime: arr.form.time,
    flight_fare: r.flight_fare != null ? String(r.flight_fare) : '',
    currency_code: r.currency_code ?? 'KRW',
    pnr: r.pnr ?? '',
  }
}

function FlightFormFields({
  form,
  setForm,
  voyages,
  showVoyageSelect,
}: {
  form: FlightForm
  setForm: React.Dispatch<React.SetStateAction<FlightForm>>
  voyages: { id: string; departure_date: string; region: string }[]
  showVoyageSelect: boolean
}) {
  function set(field: keyof FlightForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {showVoyageSelect && (
        <div className="col-span-2 sm:col-span-4">
          <label className="label">행사</label>
          <Select value={form.voyage_id} onChange={set('voyage_id')} className="h-7 py-0 text-sm">
            <option value="">행사를 선택하세요</option>
            {voyages.map(v => (
              <option key={v.id} value={v.id}>{voyageTitle(v)}</option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <label className="label">편명</label>
        <Input value={form.flight_num} onChange={set('flight_num')} placeholder="KE907" className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">출발지 (IATA)</label>
        <Input value={form.dep_airport} onChange={set('dep_airport')} placeholder="ICN" className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">도착지 (IATA)</label>
        <Input value={form.arr_airport} onChange={set('arr_airport')} placeholder="BCN" className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">PNR</label>
        <Input value={form.pnr} onChange={set('pnr')} placeholder="XYZABC" className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">출발일 (현지)</label>
        <Input type="date" value={form.departureDate} onChange={set('departureDate')} className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">출발시간 (현지)</label>
        <Input type="time" value={form.departureTime} onChange={set('departureTime')} className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">도착일 (현지)</label>
        <Input type="date" value={form.arrivalDate} onChange={set('arrivalDate')} className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">도착시간 (현지)</label>
        <Input type="time" value={form.arrivalTime} onChange={set('arrivalTime')} className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">항공요금</label>
        <Input type="number" value={form.flight_fare} onChange={set('flight_fare')} placeholder="0" className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">통화</label>
        <Select value={form.currency_code} onChange={set('currency_code')} className="h-7 py-0 text-sm">
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>
    </div>
  )
}

export default function FlightsTab() {
  const [filter, setFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FlightForm>(EMPTY_FORM)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<FlightForm>(EMPTY_FORM)
  const qc = useQueryClient()

  const { data = [], isLoading } = useQuery({
    queryKey: ['all-voyage-flights'],
    queryFn: fetchAllVoyageFlights,
  })

  const { data: voyages = [] } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const editMut = useMutation({
    mutationFn: (id: string) => updateVoyageFlight(id, {
      voyage_id: editForm.voyage_id,
      flight_num: editForm.flight_num,
      dep_airport: editForm.dep_airport,
      arr_airport: editForm.arr_airport,
      departureDate: editForm.departureDate,
      departureTime: editForm.departureTime,
      arrivalDate: editForm.arrivalDate,
      arrivalTime: editForm.arrivalTime,
      flight_fare: editForm.flight_fare ? Number(editForm.flight_fare) : undefined,
      currency_code: editForm.currency_code,
      pnr: editForm.pnr || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-voyage-flights'] })
      setEditingId(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteVoyageFlight,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-voyage-flights'] }),
  })

  const addMut = useMutation({
    mutationFn: () => insertVoyageFlight({
      voyage_id: addForm.voyage_id,
      flight_num: addForm.flight_num,
      dep_airport: addForm.dep_airport,
      arr_airport: addForm.arr_airport,
      departureDate: addForm.departureDate,
      departureTime: addForm.departureTime,
      arrivalDate: addForm.arrivalDate,
      arrivalTime: addForm.arrivalTime,
      flight_fare: addForm.flight_fare ? Number(addForm.flight_fare) : undefined,
      currency_code: addForm.currency_code,
      pnr: addForm.pnr || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-voyage-flights'] })
      setAddOpen(false)
      setAddForm(EMPTY_FORM)
    },
  })

  function startEdit(r: VoyageFlight) {
    setEditForm(initEditForm(r))
    setEditingId(r.id)
    editMut.reset()
  }

  const filtered = data.filter(r =>
    !filter ||
    (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
    r.flight_num.toLowerCase().includes(filter.toLowerCase()) ||
    r.dep_airport.toLowerCase().includes(filter.toLowerCase()) ||
    r.arr_airport.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">항공</h1>
          <p className="text-sm text-slate-400">전체 {data.length}편 · 현지 시각 기준, DST 반영</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="행사명·편명·공항코드 검색"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <Button size="sm" onClick={() => { setAddForm(EMPTY_FORM); setAddOpen(o => !o) }}>
            <Plus className="h-3.5 w-3.5" /> 추가
          </Button>
        </div>
      </div>

      {/* 추가 폼 */}
      {addOpen && (
        <div className="rounded-lg border border-brand/30 bg-brand/5 p-4">
          <p className="mb-3 text-xs font-semibold text-brand">새 항공편 추가</p>
          {addMut.isError && (
            <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 공항 코드와 날짜를 확인해주세요.</p>
          )}
          <FlightFormFields form={addForm} setForm={setAddForm} voyages={voyages} showVoyageSelect />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => addMut.mutate()}
              disabled={addMut.isPending || !addForm.voyage_id || !addForm.flight_num || !addForm.departureDate}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />{addMut.isPending ? '저장 중…' : '저장'}
            </button>
            <button
              onClick={() => setAddOpen(false)}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-400 hover:bg-slate-100 transition"
            >
              <X className="h-3.5 w-3.5" />취소
            </button>
          </div>
        </div>
      )}

      {/* 테이블 */}
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
              <th className="px-3 py-2.5 w-14" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
            )}
            {filtered.map(r => {
              const dep = localDt(r.dep_datetime, r.dep_airport)
              const arr = localDt(r.arr_datetime, r.arr_airport)
              const isEdit = editingId === r.id
              return (
                <>
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                      {r.voyages ? voyageTitle(r.voyages) : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-700">{r.flight_num}</td>
                    <td className="px-3 py-2 font-mono text-slate-600">{r.dep_airport}</td>
                    <td className="px-3 py-2 font-mono text-slate-600">{r.arr_airport}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{dep.display.date}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">{dep.display.time}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{arr.display.date}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">{arr.display.time}</td>
                    <td className="px-3 py-2 text-slate-600">{r.flight_duration ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {formatFare(r.flight_fare, r.currency_code)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        {!isEdit && (
                          <>
                            <button
                              onClick={() => startEdit(r)}
                              className="rounded p-1 text-slate-400 hover:text-brand hover:bg-slate-100 transition"
                              title="편집"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteMut.mutate(r.id)}
                              disabled={deleteMut.isPending && deleteMut.variables === r.id}
                              className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                              title="삭제"
                            >
                              {deleteMut.isPending && deleteMut.variables === r.id
                                ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                                : <Trash2 className="h-3.5 w-3.5" />
                              }
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isEdit && (
                    <tr key={`${r.id}-edit`}>
                      <td colSpan={11} className="px-4 py-3 bg-brand/5 border-t border-brand/10">
                        {editMut.isError && (
                          <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 공항 코드와 날짜를 확인해주세요.</p>
                        )}
                        <FlightFormFields form={editForm} setForm={setEditForm} voyages={voyages} showVoyageSelect={false} />
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => editMut.mutate(r.id)}
                            disabled={editMut.isPending}
                            className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-40"
                          >
                            <Check className="h-3.5 w-3.5" />{editMut.isPending ? '저장 중…' : '저장'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={editMut.isPending}
                            className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-400 hover:bg-slate-100 transition"
                          >
                            <X className="h-3.5 w-3.5" />취소
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
