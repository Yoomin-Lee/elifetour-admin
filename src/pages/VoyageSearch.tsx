import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import VoyageCombobox from '@/components/voyages/VoyageCombobox'
import { YearSelect } from '@/components/ui/year-select'
import { FieldSelect } from '@/components/ui/field-select'
import OverviewCard from '@/components/voyages/OverviewCard'
import CabinPriceCard from '@/components/voyages/CabinPriceCard'
import FlightsCard from '@/components/voyages/FlightsCard'
import ItineraryCard from '@/components/voyages/ItineraryCard'
import CancellationCard from '@/components/voyages/CancellationCard'
import HistoryCard from '@/components/voyages/HistoryCard'
import FeedbackCard from '@/components/voyages/FeedbackCard'
import {
  fetchVoyages,
  fetchFlights,
  fetchItinerary,
  fetchCancellationPolicies,
  fetchHistory,
  fetchFeedbackLogs,
  fetchCabinGrades,
  deleteVoyage,
} from '@/lib/queries/voyages'
import { getLastVoyageId, setLastVoyageId } from '@/lib/lastVoyage'

export default function VoyageSearch() {
  return <VoyageSearchInner />
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className ?? ''}`} />
}

function VoyageSearchInner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const voyageId = searchParams.get('voyage')

  // 다른 탭·메뉴를 봤다가 돌아왔을 때(=이 컴포넌트가 새로 마운트될 때) 한 번만,
  // 마지막으로 조회한 항차를 복원한다. 조회 중 필터 변경/삭제로 인한 명시적
  // 선택 해제는 다시 덮어쓰지 않도록 마운트 시 1회로 한정.
  useEffect(() => {
    if (!voyageId) {
      const remembered = getLastVoyageId()
      if (remembered) setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('voyage', remembered); return next }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 조회한 항차는 계속 최신 상태로 기억해둔다.
  useEffect(() => {
    if (voyageId) setLastVoyageId(voyageId)
  }, [voyageId])

  const { user, profile, canWrite, isAdmin } = useAuth() as {
    user: { email?: string; user_metadata?: { name?: string; full_name?: string } } | null
    profile: { display_name?: string | null } | null
    canWrite: boolean
    isAdmin: boolean
  }

  const authorName =
    profile?.display_name ??
    user?.user_metadata?.name ??
    user?.user_metadata?.full_name ??
    user?.email ??
    '직원'

  const [yearFilter, setYearFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const qc = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: deleteVoyage,
    onSuccess: () => {
      toast.success('삭제되었습니다')
      qc.invalidateQueries({ queryKey: ['voyages'] })
      setLastVoyageId(null)
      setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('voyage'); return next })
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  function handleDelete() {
    if (!selectedVoyage) return
    const label = [selectedVoyage.region, selectedVoyage.ship_name, selectedVoyage.departure_date].filter(Boolean).join(' ')  || '이 행사'
    if (!window.confirm(`"${label}"를 삭제하시겠습니까?\n\n항공, 기항지, 취소료 등 모든 데이터가 함께 삭제됩니다.`)) return
    deleteMutation.mutate(voyageId!)
  }

  const voyagesQuery = useQuery({ queryKey: ['voyages'], queryFn: fetchVoyages, refetchOnMount: 'always' })

  const years = useMemo(() => {
    const ys = new Set<string>()
    voyagesQuery.data?.forEach(v => {
      if (v.departure_date) ys.add(v.departure_date.slice(0, 4))
    })
    return Array.from(ys).sort().reverse()
  }, [voyagesQuery.data])

  const filteredVoyages = useMemo(() => {
    const all = voyagesQuery.data ?? []
    return all.filter(v => {
      if (yearFilter !== 'ALL' && !v.departure_date?.startsWith(yearFilter)) return false
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false
      return true
    })
  }, [voyagesQuery.data, yearFilter, statusFilter])

  const flightsQuery = useQuery({
    queryKey: ['flights', voyageId],
    queryFn: () => fetchFlights(voyageId!),
    enabled: !!voyageId,
  })
  const itineraryQuery = useQuery({
    queryKey: ['itinerary', voyageId],
    queryFn: () => fetchItinerary(voyageId!),
    enabled: !!voyageId,
  })
  const cancellationQuery = useQuery({
    queryKey: ['cancellation', voyageId],
    queryFn: () => fetchCancellationPolicies(voyageId!),
    enabled: !!voyageId,
  })
  const historyQuery = useQuery({
    queryKey: ['history', voyageId],
    queryFn: () => fetchHistory(voyageId!),
    enabled: !!voyageId,
  })
  const cabinGradesQuery = useQuery({
    queryKey: ['cabin-grades', voyageId],
    queryFn: () => fetchCabinGrades(voyageId!),
    enabled: !!voyageId,
  })
  const feedbackQuery = useQuery({
    queryKey: ['feedback', voyageId],
    queryFn: () => fetchFeedbackLogs(voyageId!),
    enabled: !!voyageId,
  })

  const selectedVoyage = voyagesQuery.data?.find(v => v.id === voyageId)
  const isLoading = flightsQuery.isLoading || itineraryQuery.isLoading || cancellationQuery.isLoading || historyQuery.isLoading || cabinGradesQuery.isLoading || feedbackQuery.isLoading

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">항차 조회</h1>
          <p className="text-sm text-slate-400">행사를 선택하면 전체 정보를 확인할 수 있습니다</p>
        </div>

        {/* 연도 드롭다운 + 행사 선택 */}
        <div className="flex items-center gap-2">
          <YearSelect
            value={yearFilter}
            years={years}
            onChange={y => {
              setYearFilter(y)
              if (selectedVoyage && !selectedVoyage.departure_date?.startsWith(y) && y !== 'ALL') {
                setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('voyage'); return next })
              }
            }}
          />
          <FieldSelect
            value={statusFilter}
            options={[
              { value: 'ALL', label: '전체 상태' },
              '미오픈', '판매중', '마감', '출발완료', '취소',
            ]}
            onChange={v => {
              setStatusFilter(v)
              if (selectedVoyage && v !== 'ALL' && selectedVoyage.status !== v) {
                setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('voyage'); return next })
              }
            }}
            className="h-8 text-sm w-28"
          />
          <VoyageCombobox
            voyages={filteredVoyages}
            selectedId={voyageId}
            onSelect={id => setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('voyage', id); return next })}
            loading={voyagesQuery.isLoading}
          />
        </div>
      </div>

      {/* 행사 미선택 */}
      {!voyageId && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 text-slate-400">
          <svg className="mb-3 h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 9h.01M15 9h.01M9.5 13.5a4 4 0 005 0" />
          </svg>
          <p className="text-sm font-medium">위에서 행사를 선택해주세요</p>
        </div>
      )}

      {/* 로딩 스켈레톤 */}
      {voyageId && isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[10fr_11fr]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-80" />
            <Skeleton className="h-64" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-56" />
          </div>
        </div>
      )}

      {/* 선택된 행사 삭제 버튼 — admin 전용 (RLS: delete voyages = admin only) */}
      {voyageId && selectedVoyage && isAdmin && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleteMutation.isPending ? '삭제 중…' : '행사 삭제'}
          </button>
        </div>
      )}

      {/* 콘텐츠 */}
      {voyageId && !isLoading && selectedVoyage && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[10fr_11fr]">
          {/* 왼쪽: 개요 + 기항지 + 히스토리 */}
          <div className="flex flex-col gap-4">
            <OverviewCard voyage={selectedVoyage} itinerary={itineraryQuery.data ?? []} canWrite={canWrite} />
            <ItineraryCard days={itineraryQuery.data ?? []} voyageId={voyageId} canWrite={canWrite} departureDate={selectedVoyage.departure_date} />
            <HistoryCard
              logs={historyQuery.data ?? []}
              voyageId={voyageId}
              author={authorName}
              canWrite={canWrite}
            />
          </div>
          {/* 오른쪽: 캐빈가 + 항공 + 취소료 + 피드백 */}
          <div className="flex flex-col gap-4">
            <CabinPriceCard grades={cabinGradesQuery.data ?? []} voyageId={voyageId} canWrite={canWrite} />
            <FlightsCard flights={flightsQuery.data ?? []} voyageId={voyageId} canWrite={canWrite} airline={selectedVoyage.airline} airlineReturn={selectedVoyage.airline_return} />
            <CancellationCard
              policies={cancellationQuery.data ?? []}
              departureDate={selectedVoyage.departure_date}
              boardingDate={selectedVoyage.boarding_date}
              voyageId={voyageId}
              canWrite={canWrite}
            />
            <FeedbackCard
              logs={feedbackQuery.data ?? []}
              voyageId={voyageId}
              author={authorName}
              canWrite={canWrite}
            />
          </div>
        </div>
      )}
    </div>
  )
}
