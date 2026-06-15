import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import VoyageCombobox from '@/components/voyages/VoyageCombobox'
import OverviewCard from '@/components/voyages/OverviewCard'
import FlightsCard from '@/components/voyages/FlightsCard'
import ItineraryCard from '@/components/voyages/ItineraryCard'
import CancellationCard from '@/components/voyages/CancellationCard'
import HistoryCard from '@/components/voyages/HistoryCard'
import {
  fetchVoyages,
  fetchFlights,
  fetchItinerary,
  fetchCancellationPolicies,
  fetchHistory,
} from '@/lib/queries/voyages'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function VoyageSearch() {
  return (
    <QueryClientProvider client={queryClient}>
      <VoyageSearchInner />
    </QueryClientProvider>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className ?? ''}`} />
}

function VoyageSearchInner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const voyageId = searchParams.get('voyage')
  const { user } = useAuth() as { user: { email?: string; user_metadata?: { name?: string; full_name?: string } } | null }

  const authorName =
    user?.user_metadata?.name ??
    user?.user_metadata?.full_name ??
    user?.email ??
    '직원'

  const voyagesQuery = useQuery({ queryKey: ['voyages'], queryFn: fetchVoyages })
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

  const selectedVoyage = voyagesQuery.data?.find(v => v.id === voyageId)
  const isLoading = flightsQuery.isLoading || itineraryQuery.isLoading || cancellationQuery.isLoading || historyQuery.isLoading

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">항차 조회</h1>
          <p className="text-sm text-slate-400">행사를 선택하면 전체 정보를 확인할 수 있습니다</p>
        </div>
        <VoyageCombobox
          voyages={voyagesQuery.data ?? []}
          selectedId={voyageId}
          onSelect={id => setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('voyage', id); return next })}
          loading={voyagesQuery.isLoading}
        />
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

      {/* 콘텐츠 */}
      {voyageId && !isLoading && selectedVoyage && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 왼쪽: 개요 + 기항지 + 히스토리 */}
          <div className="flex flex-col gap-4">
            <OverviewCard voyage={selectedVoyage} />
            <ItineraryCard days={itineraryQuery.data ?? []} voyageId={voyageId} />
            <HistoryCard
              logs={historyQuery.data ?? []}
              voyageId={voyageId}
              author={authorName}
            />
          </div>
          {/* 오른쪽: 항공 + 취소료 */}
          <div className="flex flex-col gap-4">
            <FlightsCard flights={flightsQuery.data ?? []} voyageId={voyageId} />
            <CancellationCard
              policies={cancellationQuery.data ?? []}
              departureDate={selectedVoyage.departure_date}
              voyageId={voyageId}
            />
          </div>
        </div>
      )}
    </div>
  )
}
