import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { fetchAllHotels, addHotel, updateHotel, deleteHotel, fetchVoyages } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { Hotel } from '@/types/database'

const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'GBP'] as const

type HotelForm = {
  voyage_id: string
  stay_date: string
  hotel_name: string
  room_rate: string
  currency: string
  sort_order: string
}

const EMPTY_FORM: HotelForm = {
  voyage_id: '', stay_date: '', hotel_name: '', room_rate: '', currency: 'USD', sort_order: '0',
}

function toForm(h: Hotel): HotelForm {
  return {
    voyage_id: h.voyage_id,
    stay_date: h.stay_date,
    hotel_name: h.hotel_name,
    room_rate: h.room_rate != null ? String(h.room_rate) : '',
    currency: h.currency ?? 'USD',
    sort_order: String(h.sort_order),
  }
}

function calcDDay(departure: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dep = new Date(departure); dep.setHours(0, 0, 0, 0)
  const diff = Math.round((dep.getTime() - today.getTime()) / 86_400_000)
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return 'D-day'
  return `D+${Math.abs(diff)}`
}

function formatRate(rate: number | null, currency: string): string {
  if (!rate) return '—'
  const sym = currency === 'KRW' ? '₩' : currency === 'EUR' ? '€' : currency === 'SGD' ? 'S$' : '$'
  return `${sym}${rate.toLocaleString()}`
}

function HotelFormFields({
  form,
  setForm,
  voyages,
  showVoyageSelect,
}: {
  form: HotelForm
  setForm: React.Dispatch<React.SetStateAction<HotelForm>>
  voyages: { id: string; departure_date: string; region: string }[]
  showVoyageSelect: boolean
}) {
  function set(field: keyof HotelForm) {
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
        <label className="label">투숙일</label>
        <Input type="date" value={form.stay_date} onChange={set('stay_date')} className="h-7 text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">호텔명</label>
        <Input value={form.hotel_name} onChange={set('hotel_name')} placeholder="Grand Hyatt Barcelona" className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">통화</label>
        <Select value={form.currency} onChange={set('currency')} className="h-7 py-0 text-sm">
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>
      <div>
        <label className="label">객실요금</label>
        <Input type="number" value={form.room_rate} onChange={set('room_rate')} placeholder="250" className="h-7 text-sm" />
      </div>
    </div>
  )
}

export default function HotelTab() {
  const [filter, setFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<HotelForm>(EMPTY_FORM)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<HotelForm>(EMPTY_FORM)
  const qc = useQueryClient()
  const { canWrite } = useAuth() as { canWrite: boolean }

  const { data = [], isLoading } = useQuery({
    queryKey: ['all-hotels'],
    queryFn: fetchAllHotels,
  })

  const { data: voyages = [] } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const editMut = useMutation({
    mutationFn: (id: string) => updateHotel(id, {
      stay_date: editForm.stay_date,
      hotel_name: editForm.hotel_name,
      room_rate: editForm.room_rate ? Number(editForm.room_rate) : null,
      currency: editForm.currency,
      sort_order: Number(editForm.sort_order) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-hotels'] })
      setEditingId(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteHotel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-hotels'] }),
  })

  const addMut = useMutation({
    mutationFn: () => addHotel(addForm.voyage_id, {
      stay_date: addForm.stay_date,
      hotel_name: addForm.hotel_name,
      room_rate: addForm.room_rate ? Number(addForm.room_rate) : null,
      currency: addForm.currency,
      sort_order: Number(addForm.sort_order) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-hotels'] })
      setAddOpen(false)
      setAddForm(EMPTY_FORM)
    },
  })

  function startEdit(h: Hotel) {
    setEditForm(toForm(h))
    setEditingId(h.id)
    editMut.reset()
  }

  const filtered = data.filter(r =>
    !filter ||
    (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
    r.hotel_name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">호텔</h1>
          <p className="text-sm text-slate-400">전체 {data.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="행사명·호텔명 검색"
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
          <p className="mb-3 text-xs font-semibold text-brand">새 호텔 추가</p>
          {addMut.isError && (
            <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
          )}
          <HotelFormFields form={addForm} setForm={setAddForm} voyages={voyages} showVoyageSelect />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => addMut.mutate()}
              disabled={addMut.isPending || !addForm.voyage_id || !addForm.hotel_name || !addForm.stay_date}
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

      {/* 빈 상태 */}
      {data.length === 0 && !isLoading && !addOpen && (
        <div className="rounded-lg border-2 border-dashed border-slate-200 py-16 text-center text-slate-400">
          <p className="text-sm">등록된 호텔 정보가 없습니다</p>
          <p className="mt-1 text-xs">위의 추가 버튼으로 호텔 정보를 입력하세요</p>
        </div>
      )}

      {/* 테이블 */}
      {(data.length > 0 || isLoading) && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[700px] w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">투숙일</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">호텔</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-24">객실요금</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-16">D-DAY</th>
                <th className="px-3 py-2.5 w-14" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
              )}
              {filtered.map(r => {
                const isEdit = editingId === r.id
                return (
                  <>
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                        {r.voyages ? voyageTitle(r.voyages) : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(r.stay_date)}</td>
                      <td className="px-3 py-2 text-slate-700 font-medium">{r.hotel_name}</td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {formatRate(r.room_rate, r.currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">
                        {r.voyages ? calcDDay(r.voyages.departure_date) : '—'}
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
                        <td colSpan={6} className="px-4 py-3 bg-brand/5 border-t border-brand/10">
                          {editMut.isError && (
                            <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
                          )}
                          <HotelFormFields form={editForm} setForm={setEditForm} voyages={voyages} showVoyageSelect={false} />
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
      )}
    </div>
  )
}
