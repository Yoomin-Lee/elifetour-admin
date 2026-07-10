import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { Search, Plus, Eye, Copy, Pencil, Check, X, ExternalLink, ChevronDown } from 'lucide-react'
import { fetchVoyages, duplicateVoyage, updateVoyage } from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import type { Voyage, VoyageStatus } from '@/types/database'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import { CruiseLineBadge } from '@/components/ui/cruise-line-badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** 여러 개 선택 가능한 드롭다운 — 선택 없음(빈 배열)은 "전체"를 의미 */
function MultiSelectDropdown({
  allLabel, options, selected, onChange, formatOption,
}: {
  allLabel: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
  formatOption?: (opt: string) => string
}) {
  const [open, setOpen] = useState(false)

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt])
  }

  const fmt = (opt: string) => formatOption ? formatOption(opt) : opt
  const buttonLabel = selected.length === 0
    ? allLabel
    : selected.length === 1
      ? fmt(selected[0])
      : `${fmt(selected[0])} 외 ${selected.length - 1}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('h-9 gap-1.5 font-medium', selected.length > 0 ? 'border-brand/40 text-brand bg-brand/5' : 'text-slate-700')}
        >
          <span className="whitespace-nowrap">{buttonLabel}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', open && 'rotate-180')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 py-1">
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-slate-50',
            selected.length === 0 ? 'font-semibold text-brand' : 'text-slate-700',
          )}
        >
          <Check className={cn('h-3.5 w-3.5 shrink-0', selected.length === 0 ? 'opacity-100' : 'opacity-0')} />
          {allLabel}
        </button>
        <div className="my-1 border-t border-slate-100" />
        {options.map(opt => {
          const checked = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-slate-50',
                checked ? 'font-semibold text-brand' : 'text-slate-700',
              )}
            >
              <Check className={cn('h-3.5 w-3.5 shrink-0', checked ? 'opacity-100' : 'opacity-0')} />
              {fmt(opt)}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

const STATUS_COLORS: Record<string, string> = {
  '미오픈':   'bg-slate-100 text-slate-600',
  '판매중':   'bg-blue-100 text-blue-700',
  '마감':     'bg-amber-100 text-amber-700',
  '출발완료': 'bg-green-100 text-green-700',
  '취소':     'bg-red-100 text-red-500',
}

const STATUSES: VoyageStatus[] = ['미오픈', '판매중', '마감', '출발완료', '취소']

function calcDDay(departure: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dep = new Date(departure); dep.setHours(0, 0, 0, 0)
  const diff = Math.round((dep.getTime() - today.getTime()) / 86_400_000)
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return 'D-day'
  return `D+${Math.abs(diff)}`
}

type EditForm = {
  status: VoyageStatus
  customer_count: string
  tour_leader: string
}

function toForm(v: Voyage): EditForm {
  return {
    status: v.status,
    customer_count: String(v.customer_count ?? ''),
    tour_leader: v.tour_leader ?? '',
  }
}

export default function ProductTab() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { canWrite } = useAuth() as { canWrite: boolean }
  const [searchParams] = useSearchParams()

  // 대시보드 카드 클릭 시 URL 파라미터로 초기 필터 세팅
  const initStatus = searchParams.get('status') ?? 'ALL'
  const initMonthFilter = searchParams.get('filter') === 'this-month'

  const [filter, setFilter] = useState('')
  const [yearFilter, setYearFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>(initStatus === 'ALL' ? [] : [initStatus])
  const [monthFilter, setMonthFilter] = useState<boolean>(initMonthFilter)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ status: '미오픈', customer_count: '', tour_leader: '' })

  const { data: voyages = [], isLoading } = useQuery({
    queryKey: ['voyages'],
    queryFn: fetchVoyages,
  })

  const dupMut = useMutation({
    mutationFn: duplicateVoyage,
    onSuccess: (newVoyage) => {
      qc.invalidateQueries({ queryKey: ['voyages'] })
      setDuplicatingId(null)
      toast.success('행사가 복제됐습니다', {
        description: newVoyage.region ?? '새 행사를 목록에서 확인하세요',
        action: {
          label: '바로 보기',
          onClick: () => navigate(`/voyages?tab=항차검색&voyage=${newVoyage.id}`),
        },
      })
    },
    onError: () => {
      setDuplicatingId(null)
      toast.error('복제에 실패했습니다')
    },
  })

  const saveMut = useMutation({
    mutationFn: (id: string) => updateVoyage(id, {
      status: editForm.status,
      customer_count: Number(editForm.customer_count) || 0,
      tour_leader: editForm.tour_leader || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voyages'] })
      setEditingId(null)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  function startEdit(v: Voyage) {
    setEditForm(toForm(v))
    setEditingId(v.id)
    saveMut.reset()
  }

  function set(field: keyof EditForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setEditForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const years = useMemo(() => {
    const ys = new Set<string>()
    voyages.forEach(v => { if (v.departure_date) ys.add(v.departure_date.slice(0, 4)) })
    return Array.from(ys).sort().reverse()
  }, [voyages])

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const filtered = voyages.filter(v => {
    if (monthFilter && !v.departure_date?.startsWith(thisMonth)) return false
    if (!monthFilter && yearFilter.length > 0 && !yearFilter.some(y => v.departure_date?.startsWith(y))) return false
    if (statusFilter.length > 0 && !statusFilter.includes(v.status)) return false
    return !filter || voyageTitle(v).toLowerCase().includes(filter.toLowerCase()) ||
      (v.region ?? '').includes(filter) ||
      (v.cruise_line ?? '').toLowerCase().includes(filter.toLowerCase()) ||
      (v.tour_leader ?? '').includes(filter)
  })

  const active = filtered.filter(v => v.status !== '취소')
  const cancelled = filtered.filter(v => v.status === '취소')
  const ordered = [...active, ...cancelled]

  return (
    <div className="w-fit max-w-full mx-auto space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">항차 검색</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-slate-400">전체 {voyages.length}건 · 취소 제외 {active.length}건</p>
            {monthFilter && (
              <button
                onClick={() => setMonthFilter(false)}
                className="flex items-center gap-1 rounded-full bg-cyan-100 text-cyan-700 px-2 py-0.5 text-xs font-medium hover:bg-cyan-200 transition"
              >
                이번달 출발
                <span className="ml-0.5 opacity-60">✕</span>
              </button>
            )}
            {statusFilter.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(prev => prev.filter(x => x !== s))}
                className="flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2 py-0.5 text-xs font-medium hover:bg-brand/20 transition"
              >
                {s}
                <span className="ml-0.5 opacity-60">✕</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MultiSelectDropdown
            allLabel="전체 연도"
            options={years}
            selected={monthFilter ? [] : yearFilter}
            onChange={v => { setYearFilter(v); setMonthFilter(false) }}
            formatOption={y => `${y}년`}
          />
          <MultiSelectDropdown
            allLabel="전체 상태"
            options={STATUSES}
            selected={statusFilter}
            onChange={setStatusFilter}
          />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="행사명·선사·인솔자 검색"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          {canWrite && (
            <Button size="sm" onClick={() => navigate('/voyages/new')}>
              <Plus className="h-4 w-4" /> 새 행사 등록
            </Button>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-[1160px] table-fixed text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">출발일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">귀국일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">선사</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">크루즈</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-28 whitespace-nowrap">항공</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">상태</th>
              <th className="px-3 py-2.5 text-center font-semibold text-slate-500 w-24">상품가</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-16">고객</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-24">인솔자</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-500 w-16">D-DAY</th>
              <th className="px-3 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td>
              </tr>
            )}
            {!isLoading && ordered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-slate-400">등록된 행사가 없습니다</td>
              </tr>
            )}
            {ordered.map(v => {
              const isCancelled = v.status === '취소'
              const isEdit = editingId === v.id
              return (
                <>
                  <tr
                    key={v.id}
                    className={[
                      'hover:bg-slate-50 transition-colors',
                      isCancelled ? 'opacity-50' : '',
                    ].join(' ')}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/voyages?tab=항차검색&voyage=${v.id}`)}
                        className={`group flex items-center gap-1 transition hover:text-brand ${isCancelled ? 'line-through text-slate-400' : 'font-medium text-slate-800'}`}
                        title="항차 상세에서 보기"
                      >
                        {voyageTitle(v)}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(v.departure_date)}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{v.return_date ? formatDate(v.return_date) : '—'}</td>
                    <td className="px-3 py-2"><CruiseLineBadge value={v.cruise_line} /></td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">{v.ship_name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {v.airline && v.airline_return
                        ? `${v.airline} / ${v.airline_return}`
                        : (v.airline ?? v.airline_return ?? '—')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[v.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-slate-700 whitespace-nowrap">
                      {v.product_price ? `${v.product_price.toLocaleString()}원` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700 font-medium whitespace-nowrap">{v.customer_count}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">{v.tour_leader ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={[
                        'font-mono text-[11px]',
                        isCancelled ? 'text-slate-400' : 'text-slate-700',
                      ].join(' ')}>
                        {calcDDay(v.departure_date)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        {!isEdit && (
                          <>
                            {canWrite && (
                              <button
                                title="편집"
                                onClick={() => startEdit(v)}
                                className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-100 transition"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              title="항차 조회"
                              onClick={() => navigate(`/voyages?tab=항차검색&voyage=${v.id}`)}
                              className="p-1 rounded text-slate-400 hover:text-brand transition"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {canWrite && (
                              <button
                                title="복제"
                                onClick={() => { setDuplicatingId(v.id); dupMut.mutate(v.id) }}
                                disabled={duplicatingId !== null}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 transition disabled:opacity-40"
                              >
                                {duplicatingId === v.id
                                  ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                                  : <Copy className="h-3.5 w-3.5" />
                                }
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isEdit && (
                    <tr key={`${v.id}-edit`}>
                      <td colSpan={12} className="px-3 py-3 bg-brand/5 border-t border-brand/10">
                        {saveMut.isError && (
                          <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-2">
                          <div>
                            <label className="label">상태</label>
                            <FieldSelect
                              value={editForm.status}
                              options={[...STATUSES]}
                              onChange={v => setEditForm(prev => ({ ...prev, status: v as VoyageStatus }))}
                              className="h-7 text-sm"
                            />
                          </div>
                          <div>
                            <label className="label">고객 수</label>
                            <Input
                              type="number"
                              min={0}
                              value={editForm.customer_count}
                              onChange={set('customer_count')}
                              className="h-7 text-sm"
                            />
                          </div>
                          <div>
                            <label className="label">인솔자</label>
                            <Input
                              value={editForm.tour_leader}
                              onChange={set('tour_leader')}
                              placeholder="미정"
                              className="h-7 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveMut.mutate(v.id)}
                            disabled={saveMut.isPending}
                            className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-40"
                          >
                            <Check className="h-3.5 w-3.5" />{saveMut.isPending ? '저장 중…' : '저장'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={saveMut.isPending}
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
