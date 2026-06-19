import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, Check, X, ChevronDown, ExternalLink } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { useAuth } from '@/context/AuthContext'
import { fetchAllHotels, addHotel, updateHotel, deleteHotel, fetchVoyages } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { YearSelect } from '@/components/ui/year-select'
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
          <div className="relative">
            <Select value={form.voyage_id} onChange={set('voyage_id')} className="h-7 py-0 text-sm appearance-none pr-7">
              <option value="">행사를 선택하세요</option>
              {voyages.map(v => (
                <option key={v.id} value={v.id}>{voyageTitle(v)}</option>
              ))}
            </Select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      )}
      <div>
        <label className="label">투숙일</label>
        <DatePicker value={form.stay_date} onChange={v => setForm(prev => ({ ...prev, stay_date: v }))} placeholder="투숙일" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">호텔명</label>
        <Input value={form.hotel_name} onChange={set('hotel_name')} placeholder="Grand Hyatt Barcelona" className="h-7 text-sm" />
      </div>
      <div>
        <label className="label">통화</label>
        <div className="relative">
          <Select value={form.currency} onChange={set('currency')} className="h-7 py-0 text-sm appearance-none pr-7">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>
      <div>
        <label className="label">객실요금</label>
        <Input type="number" value={form.room_rate} onChange={set('room_rate')} placeholder="250" className="h-7 text-sm" />
      </div>
    </div>
  )
}

export default function HotelTab() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('ALL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<HotelForm>(EMPTY_FORM)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<HotelForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
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
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteHotel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-hotels'] })
      setDeleteTarget(null)
      toast.success('삭제됐습니다')
    },
    onError: () => toast.error('삭제에 실패했습니다'),
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
      toast.success('추가됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  function startEdit(h: Hotel) {
    setEditForm(toForm(h))
    setEditingId(h.id)
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

  const filtered = [...data]
    .filter(r => {
      if (yearFilter !== 'ALL' && !r.voyages?.departure_date?.startsWith(yearFilter)) return false
      return !filter ||
        (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
        r.hotel_name.toLowerCase().includes(filter.toLowerCase())
    })
    .sort((a, b) => {
      const dateDiff = b.stay_date.localeCompare(a.stay_date)
      if (dateDiff !== 0) return dateDiff
      const aVoy = a.voyages?.departure_date ?? ''
      const bVoy = b.voyages?.departure_date ?? ''
      return bVoy.localeCompare(aVoy)
    })

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">호텔</h1>
          <p className="text-sm text-slate-400">전체 {data.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect value={yearFilter} years={years} onChange={setYearFilter} />
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
                      <td className="px-3 py-2 whitespace-nowrap">
                        {r.voyages ? (
                          <button
                            onClick={() => navigate(`/voyages?tab=항차검색&voyage=${r.voyage_id}`)}
                            className="group flex items-center gap-1 font-medium text-slate-800 hover:text-brand transition"
                            title="항차 검색에서 보기"
                          >
                            {voyageTitle(r.voyages)}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          </button>
                        ) : '—'}
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
                                onClick={() => setDeleteTarget({ id: r.id, label: r.hotel_name })}
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

      {deleteTarget && (
        <ConfirmDeleteModal
          message={`호텔 "${deleteTarget.label}"을(를) 삭제합니다.`}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          pending={deleteMut.isPending}
        />
      )}
    </div>
  )
}
