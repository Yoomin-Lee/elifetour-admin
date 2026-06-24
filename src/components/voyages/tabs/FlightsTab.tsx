import { useState, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, Check, X, ExternalLink } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import {
  fetchAllVoyageFlights,
  insertVoyageFlight,
  updateVoyageFlight,
  deleteVoyageFlight,
  restoreVoyageFlight,
} from '@/lib/queries/voyageFlights'
import { fetchVoyages } from '@/lib/queries/voyages'
import { getAirportTimezone } from '@/lib/utils/flightCalc'
import { voyageTitle } from '@/types/database'
import { Input } from '@/components/ui/input'
import { TimePicker } from '@/components/ui/time-picker'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { YearSelect } from '@/components/ui/year-select'
import { FieldSelect } from '@/components/ui/field-select'
import type { VoyageFlight } from '@/lib/queries/voyageFlights'

const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY'] as const

function localDt(isoUtc: string, airportCode: string) {
  const tz = getAirportTimezone(airportCode)
  const zoned = toZonedTime(new Date(isoUtc), tz)
  return { display: { date: format(zoned, 'MM/dd'), time: format(zoned, 'HH:mm') }, form: { date: format(zoned, 'yyyy-MM-dd'), time: format(zoned, 'HH:mm') } }
}

function airlineLabel(v: { airline?: string | null; airline_return?: string | null } | null): string | null {
  const a = v?.airline?.trim() || null
  const b = v?.airline_return?.trim() || null
  if (!a && !b) return null
  if (a && b) return `${a} / ${b}`
  return a ?? b
}

function formatFare(fare: number | null, currency: string): string {
  if (!fare) return '—'
  const sym: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥' }
  const prefix = sym[currency] ?? (currency + ' ')
  return prefix + fare.toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
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
          <FieldSelect
            value={form.voyage_id}
            options={voyages.map(v => ({ value: v.id, label: voyageTitle(v) }))}
            onChange={val => setForm(prev => ({ ...prev, voyage_id: val }))}
            placeholder="행사를 선택하세요"
          />
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
        <DatePicker value={form.departureDate} onChange={v => setForm(prev => ({ ...prev, departureDate: v }))} placeholder="출발일" />
      </div>
      <div>
        <label className="label">출발시간 (현지)</label>
        <TimePicker size="sm" value={form.departureTime} onChange={v => setForm(prev => ({ ...prev, departureTime: v }))} />
      </div>
      <div>
        <label className="label">도착일 (현지)</label>
        <DatePicker value={form.arrivalDate} onChange={v => setForm(prev => ({ ...prev, arrivalDate: v }))} placeholder="도착일" />
      </div>
      <div>
        <label className="label">도착시간 (현지)</label>
        <TimePicker size="sm" value={form.arrivalTime} onChange={v => setForm(prev => ({ ...prev, arrivalTime: v }))} />
      </div>
      <div>
        <label className="label">항공요금</label>
        <Input type="number" value={form.flight_fare} onChange={set('flight_fare')} placeholder="0" className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">통화</label>
        <FieldSelect
          value={form.currency_code}
          options={[...CURRENCIES]}
          onChange={v => setForm(prev => ({ ...prev, currency_code: v }))}
          className="h-7 text-sm px-2"
        />
      </div>
    </div>
  )
}

export default function FlightsTab() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('ALL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FlightForm>(EMPTY_FORM)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<FlightForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const qc = useQueryClient()
  const { canWrite } = useAuth() as { canWrite: boolean }

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
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteVoyageFlight,
    onMutate: (id: string) => ({ snapshot: data.find(r => r.id === id) ?? null }),
    onSuccess: (_r, _id, ctx) => {
      qc.invalidateQueries({ queryKey: ['all-voyage-flights'] })
      setDeleteTarget(null)
      const snap = ctx?.snapshot
      toast.success('삭제됐습니다', snap ? {
        action: {
          label: '되돌리기',
          onClick: () => restoreVoyageFlight(snap)
            .then(() => { qc.invalidateQueries({ queryKey: ['all-voyage-flights'] }); toast.success('복원됐습니다') })
            .catch(() => toast.error('복원에 실패했습니다')),
        },
      } : undefined)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
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
      toast.success('추가됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  function startEdit(r: VoyageFlight) {
    setEditForm(initEditForm(r))
    setEditingId(r.id)
    editMut.reset()
  }

  const years = useMemo(() => {
    const ys = new Set<string>()
    data.forEach(r => {
      const yr = r.voyages?.departure_date?.slice(0, 4)
      if (yr) ys.add(yr)
    })
    return Array.from(ys).sort().reverse()
  }, [data])

  const filtered = data.filter(r => {
    if (yearFilter !== 'ALL' && !r.voyages?.departure_date?.startsWith(yearFilter)) return false
    return !filter ||
      (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
      r.flight_num.toLowerCase().includes(filter.toLowerCase()) ||
      r.dep_airport.toLowerCase().includes(filter.toLowerCase()) ||
      r.arr_airport.toLowerCase().includes(filter.toLowerCase())
  })

  // 행사 출발일 최신순 → 항공사 코드 알파벳순 → 출발시간 내림차순 (도착편 위, 출발편 아래)
  const sortedFiltered = [...filtered].sort((a, b) => {
    const aVoy = a.voyages?.departure_date ?? ''
    const bVoy = b.voyages?.departure_date ?? ''
    if (aVoy !== bVoy) return bVoy.localeCompare(aVoy)
    const aAirline = a.flight_num.match(/^[A-Za-z]+/)?.[0] ?? ''
    const bAirline = b.flight_num.match(/^[A-Za-z]+/)?.[0] ?? ''
    if (aAirline !== bAirline) return aAirline.localeCompare(bAirline)
    return new Date(b.dep_datetime).getTime() - new Date(a.dep_datetime).getTime()
  })

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">항공</h1>
          <p className="text-sm text-slate-400">전체 {data.length}편 · 현지 시각 기준, DST 반영</p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect value={yearFilter} years={years} onChange={setYearFilter} />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="행사명·편명·공항코드 검색"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          {canWrite && (
            <Button size="sm" onClick={() => { setAddForm(EMPTY_FORM); setAddOpen(o => !o) }}>
              <Plus className="h-3.5 w-3.5" /> 추가
            </Button>
          )}
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
            {sortedFiltered.map(r => {
              const dep = localDt(r.dep_datetime, r.dep_airport)
              const arr = localDt(r.arr_datetime, r.arr_airport)
              const isEdit = editingId === r.id
              return (
                <Fragment key={r.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.voyages ? (
                        <button
                          onClick={() => navigate(`/voyages?tab=항차검색&voyage=${r.voyage_id}`)}
                          className="group flex items-center gap-1 text-left font-medium text-slate-800 hover:text-brand transition"
                          title="항차 상세에서 보기"
                        >
                          <span>
                            <span className="block">{voyageTitle(r.voyages)}</span>
                            {airlineLabel(r.voyages) && (
                              <span className="block text-[10px] font-normal text-slate-400 group-hover:text-brand/60">
                                {airlineLabel(r.voyages)}
                              </span>
                            )}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 transition" />
                        </button>
                      ) : '—'}
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
                        {!isEdit && canWrite && (
                          <>
                            <button
                              onClick={() => startEdit(r)}
                              className="rounded p-1 text-slate-400 hover:text-brand hover:bg-slate-100 transition"
                              title="편집"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: r.id, label: `${r.flight_num} (${r.dep_airport}→${r.arr_airport})` })}
                              className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                              title="삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isEdit && (
                    <tr>
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
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          message={`항공편 ${deleteTarget.label}을(를) 삭제합니다.`}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          pending={deleteMut.isPending}
        />
      )}
    </div>
  )
}
