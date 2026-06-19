import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, Check, X, ChevronDown, ExternalLink } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { useAuth } from '@/context/AuthContext'
import { fetchAllItinerary, fetchVoyages, saveItineraryDay, deleteItineraryDay } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { formatDate, formatTime } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { Button } from '@/components/ui/button'
import { YearSelect } from '@/components/ui/year-select'
import type { ItineraryDay } from '@/types/database'

const CATEGORIES = ['크루즈', '항공', '호텔', '지상', '식사', '기타'] as const
const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'GBP'] as const

const CATEGORY_COLORS: Record<string, string> = {
  '크루즈': 'bg-blue-50 text-blue-700',
  '항공':   'bg-sky-50 text-sky-700',
  '호텔':   'bg-amber-50 text-amber-700',
  '지상':   'bg-green-50 text-green-700',
  '식사':   'bg-orange-50 text-orange-700',
}

type ShoreForm = {
  voyage_id: string
  date: string
  port: string
  arrival_time: string
  departure_time: string
  category: string
  cost: string
  cost_currency: string
  summary: string
  sort_order: string
}

const EMPTY_FORM: ShoreForm = {
  voyage_id: '', date: '', port: '', arrival_time: '', departure_time: '',
  category: '', cost: '', cost_currency: 'USD', summary: '', sort_order: '0',
}

function toForm(r: ItineraryDay & { voyage_id: string }): ShoreForm {
  return {
    voyage_id: r.voyage_id,
    date: r.date,
    port: r.port,
    arrival_time: r.arrival_time ?? '',
    departure_time: r.departure_time ?? '',
    category: r.category ?? '',
    cost: r.cost != null ? String(r.cost) : '',
    cost_currency: r.cost_currency ?? 'USD',
    summary: r.summary ?? '',
    sort_order: String(r.sort_order),
  }
}

function formatCost(cost: number | null, currency: string | null): string {
  if (!cost) return '—'
  const sym = currency === 'KRW' ? '₩' : currency === 'EUR' ? '€' : currency === 'SGD' ? 'S$' : '$'
  return `${sym}${cost.toLocaleString()}`
}

// 드롭다운 공통 래퍼
function SelectField({
  label, value, onChange, children,
}: {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
}) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="select h-7 py-0 text-sm w-full appearance-none pr-7"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
      </div>
    </div>
  )
}

function ShoreFormFields({
  form,
  setForm,
  voyages,
  showVoyageSelect,
}: {
  form: ShoreForm
  setForm: React.Dispatch<React.SetStateAction<ShoreForm>>
  voyages: { id: string; departure_date: string; region: string }[]
  showVoyageSelect: boolean
}) {
  function set(field: keyof ShoreForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {showVoyageSelect && (
        <div className="col-span-2 sm:col-span-4">
          <SelectField
            label="행사"
            value={form.voyage_id}
            onChange={set('voyage_id')}
          >
            <option value="">행사를 선택하세요</option>
            {voyages.map(v => (
              <option key={v.id} value={v.id}>{voyageTitle(v)}</option>
            ))}
          </SelectField>
        </div>
      )}
      <div>
        <label className="label">날짜</label>
        <DatePicker
          value={form.date}
          onChange={v => setForm(prev => ({ ...prev, date: v }))}
          placeholder="날짜"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">기항지</label>
        <Input value={form.port} onChange={set('port')} placeholder="Barcelona" className="h-7 text-sm" />
      </div>
      <div>
        <SelectField label="구분" value={form.category} onChange={set('category')}>
          <option value="">—</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </SelectField>
      </div>
      <div>
        <label className="label">입항</label>
        <TimePicker size="sm" value={form.arrival_time} onChange={v => setForm(prev => ({ ...prev, arrival_time: v }))} />
      </div>
      <div>
        <label className="label">출항</label>
        <TimePicker size="sm" value={form.departure_time} onChange={v => setForm(prev => ({ ...prev, departure_time: v }))} />
      </div>
      <div>
        <SelectField label="통화" value={form.cost_currency} onChange={set('cost_currency')}>
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </SelectField>
      </div>
      <div>
        <label className="label">비용</label>
        <Input type="number" min={0} value={form.cost} onChange={set('cost')} placeholder="0" className="h-7 text-sm" />
      </div>
      <div className="col-span-2 sm:col-span-4">
        <label className="label">비고</label>
        <Input value={form.summary} onChange={set('summary')} placeholder="메모" className="h-7 text-sm" />
      </div>
    </div>
  )
}

export default function ShoreTab() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('ALL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ShoreForm>(EMPTY_FORM)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<ShoreForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const qc = useQueryClient()
  const { canWrite } = useAuth() as { canWrite: boolean }

  const { data = [], isLoading } = useQuery({
    queryKey: ['all-itinerary'],
    queryFn: fetchAllItinerary,
  })

  const { data: voyages = [] } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const editMut = useMutation({
    mutationFn: (id: string) => {
      const r = data.find(d => d.id === id)
      if (!r) throw new Error('not found')
      return saveItineraryDay(r.voyage_id, {
        date: editForm.date,
        port: editForm.port,
        arrival_time: editForm.arrival_time || null,
        departure_time: editForm.departure_time || null,
        category: editForm.category || null,
        cost: editForm.cost ? Number(editForm.cost) : null,
        cost_currency: editForm.cost_currency || null,
        summary: editForm.summary || null,
        sort_order: Number(editForm.sort_order) || 0,
      }, id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-itinerary'] })
      setEditingId(null)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteItineraryDay,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-itinerary'] })
      setDeleteTarget(null)
      toast.success('삭제됐습니다')
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const addMut = useMutation({
    mutationFn: () => saveItineraryDay(addForm.voyage_id, {
      date: addForm.date,
      port: addForm.port,
      arrival_time: addForm.arrival_time || null,
      departure_time: addForm.departure_time || null,
      category: addForm.category || null,
      cost: addForm.cost ? Number(addForm.cost) : null,
      cost_currency: addForm.cost_currency || null,
      summary: addForm.summary || null,
      sort_order: Number(addForm.sort_order) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-itinerary'] })
      setAddOpen(false)
      setAddForm(EMPTY_FORM)
      toast.success('추가됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  function startEdit(r: ItineraryDay & { voyage_id: string }) {
    setEditForm(toForm(r))
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

  const filtered = [...data]
    .filter(r => {
      if (yearFilter !== 'ALL' && !r.voyages?.departure_date?.startsWith(yearFilter)) return false
      return !filter ||
        (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
        (r.port ?? '').toLowerCase().includes(filter.toLowerCase()) ||
        (r.category ?? '').includes(filter)
    })
    .sort((a, b) => {
      const aVoy = a.voyages?.departure_date ?? ''
      const bVoy = b.voyages?.departure_date ?? ''
      const voyDiff = bVoy.localeCompare(aVoy)
      if (voyDiff !== 0) return voyDiff
      return b.date.localeCompare(a.date)
    })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">지상</h1>
          <p className="text-sm text-slate-400">기항지 일정 전체 {data.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect value={yearFilter} years={years} onChange={setYearFilter} />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="행사명·기항지·구분 검색"
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
          <p className="mb-3 text-xs font-semibold text-brand">새 일정 추가</p>
          {addMut.isError && (
            <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
          )}
          <ShoreFormFields form={addForm} setForm={setAddForm} voyages={voyages} showVoyageSelect />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => addMut.mutate()}
              disabled={addMut.isPending || !addForm.voyage_id || !addForm.port || !addForm.date}
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
          <p className="text-sm">등록된 지상 일정이 없습니다</p>
          <p className="mt-1 text-xs">위의 추가 버튼으로 일정을 입력하세요</p>
        </div>
      )}

      {/* 테이블 */}
      {(data.length > 0 || isLoading) && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[960px] w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">날짜</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-28">기항지</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16">입항</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16">출항</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">구분</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-24">비용</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500">비고</th>
                <th className="px-3 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
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
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
                      <td className="px-3 py-2 text-slate-700 font-medium">{r.port}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">
                        {r.arrival_time ? formatTime(r.arrival_time) : '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">
                        {r.departure_time ? formatTime(r.departure_time) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {r.category ? (
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[r.category] ?? 'bg-slate-100 text-slate-600'}`}>
                            {r.category}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {formatCost(r.cost, r.cost_currency)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{r.summary ?? ''}</td>
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
                                onClick={() => setDeleteTarget({ id: r.id, label: `${r.port} (${r.date})` })}
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
                        <td colSpan={9} className="px-4 py-3 bg-brand/5 border-t border-brand/10">
                          {editMut.isError && (
                            <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
                          )}
                          <ShoreFormFields
                            form={editForm}
                            setForm={setEditForm}
                            voyages={voyages}
                            showVoyageSelect={false}
                          />
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
          message={`"${deleteTarget.label}" 일정을 삭제합니다.`}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          pending={deleteMut.isPending}
        />
      )}
    </div>
  )
}
