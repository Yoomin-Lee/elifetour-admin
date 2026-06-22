import { useSearchParams, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

import SearchTab      from '@/components/voyages/tabs/SearchTab'
import ProductTab     from '@/components/voyages/tabs/ProductTab'
import CruiseTab      from '@/components/voyages/tabs/CruiseTab'
import FlightsTab     from '@/components/voyages/tabs/FlightsTab'
import HotelTab       from '@/components/voyages/tabs/HotelTab'
import CancellationTab from '@/components/voyages/tabs/CancellationTab'
import ShoreTab       from '@/components/voyages/tabs/ShoreTab'
import HistoryTab     from '@/components/voyages/tabs/HistoryTab'
import MNTab          from '@/components/voyages/tabs/MNTab'
import CalendarTab    from '@/components/voyages/tabs/CalendarTab'
import PaymentTab     from '@/components/voyages/tabs/PaymentTab'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

const TABS = [
  { key: '항차검색', label: '항차 상세' },
  { key: '상품등록', label: '항차 검색' },
  { key: '크루즈',   label: '크루즈'   },
  { key: '항공',     label: '항공'     },
  { key: '호텔',     label: '호텔'     },
  { key: '취소료',   label: '취소료'   },
  { key: '지상',     label: '지상'     },
  { key: '히스토리', label: '히스토리' },
  { key: 'MN',       label: 'MN'       },
  { key: '달력',     label: '달력'     },
  { key: '결제',     label: '결제'     },
] as const

type TabKey = typeof TABS[number]['key']

function tabContent(tab: TabKey) {
  switch (tab) {
    case '항차검색': return <SearchTab />
    case '상품등록': return <ProductTab />
    case '크루즈':   return <CruiseTab />
    case '항공':     return <FlightsTab />
    case '호텔':     return <HotelTab />
    case '취소료':   return <CancellationTab />
    case '지상':     return <ShoreTab />
    case '히스토리': return <HistoryTab />
    case 'MN':       return <MNTab />
    case '달력':     return <CalendarTab />
    case '결제':     return <PaymentTab />
  }
}

function VoyageMasterInner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { canWrite } = useAuth() as { canWrite: boolean }
  const activeTab = (searchParams.get('tab') as TabKey) ?? '항차검색'
  const { connected } = useRealtimeSync()

  function switchTab(key: TabKey) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', key)
      if (key !== '항차검색' && key !== '결제') next.delete('voyage')
      return next
    })
  }

  return (
    <div className="flex flex-col">
      {/* 탭 바 */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <nav className="flex flex-1 overflow-x-auto scrollbar-none px-4" aria-label="항차 마스터 탭">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={[
                  'flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === t.key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </nav>
          {/* 실시간 연결 상태 */}
          <div className="shrink-0 flex items-center gap-1.5 px-3" title={connected ? '실시간 연결됨' : '연결 끊김'}>
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${connected ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`} />
            <span className="hidden sm:block text-[11px] text-slate-400">{connected ? '실시간' : '오프라인'}</span>
          </div>

          {canWrite && (
            <div className="shrink-0 px-3">
              <button
                type="button"
                onClick={() => navigate('/voyages/new')}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark transition"
              >
                <Plus className="h-3.5 w-3.5" />
                새 행사
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-4 sm:p-6">
        {tabContent(activeTab)}
      </div>
    </div>
  )
}

export default function VoyageMaster() {
  return (
    <QueryClientProvider client={qc}>
      <VoyageMasterInner />
    </QueryClientProvider>
  )
}
