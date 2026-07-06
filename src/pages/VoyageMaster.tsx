import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

import SearchTab      from '@/components/voyages/tabs/SearchTab'
import ProductTab     from '@/components/voyages/tabs/ProductTab'
import InventoryTab   from '@/components/voyages/tabs/InventoryTab'
import CruiseTab      from '@/components/voyages/tabs/CruiseTab'
import FlightsTab     from '@/components/voyages/tabs/FlightsTab'
import HotelTab       from '@/components/voyages/tabs/HotelTab'
import CancellationTab from '@/components/voyages/tabs/CancellationTab'
import ShoreTab       from '@/components/voyages/tabs/ShoreTab'
import FeedbackMasterTab from '@/components/voyages/tabs/FeedbackMasterTab'
import MNTab          from '@/components/voyages/tabs/MNTab'
import CalendarTab    from '@/components/voyages/tabs/CalendarTab'
import PaymentTab     from '@/components/voyages/tabs/PaymentTab'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

const TABS = [
  { key: '상품등록', label: '항차 검색' },
  { key: '항차검색', label: '항차 상세' },
  { key: '보유현황', label: '보유 현황' },
  { key: '크루즈',   label: '크루즈'   },
  { key: '항공',     label: '항공'     },
  { key: '호텔',     label: '호텔'     },
  { key: '취소료',   label: '취소료'   },
  { key: '지상',     label: '지상'     },
  { key: '히스토리', label: '피드백'   },
  { key: 'MN',       label: '취소료 규정' },
  { key: '달력',     label: '달력'     },
  { key: '결제',     label: '결제'     },
] as const

type TabKey = typeof TABS[number]['key']

// 기본적으로 탭 바에서 숨기는 항목 — 데이터/라우팅은 그대로 두고 노출만 접는다.
// 오른쪽 "탭 편집" 버튼에서 개별적으로 다시 불러올 수 있고, 불러온 탭은
// 원래 자리(TABS 배열 순서)에 그대로 나타난다.
const HIDDEN_TAB_KEYS: readonly TabKey[] = ['크루즈', '항공', '호텔', '취소료', '지상']
const VISIBLE_HIDDEN_TABS_KEY = 'voyageMaster.visibleHiddenTabs'

function tabContent(tab: TabKey) {
  switch (tab) {
    case '항차검색': return <SearchTab />
    case '상품등록': return <ProductTab />
    case '보유현황': return <InventoryTab />
    case '크루즈':   return <CruiseTab />
    case '항공':     return <FlightsTab />
    case '호텔':     return <HotelTab />
    case '취소료':   return <CancellationTab />
    case '지상':     return <ShoreTab />
    case '히스토리': return <FeedbackMasterTab />
    case 'MN':       return <MNTab />
    case '달력':     return <CalendarTab />
    case '결제':     return <PaymentTab />
  }
}

function VoyageMasterInner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { canWrite } = useAuth() as { canWrite: boolean }
  const activeTab = (searchParams.get('tab') as TabKey) ?? '상품등록'
  const { connected } = useRealtimeSync()
  const [visibleHidden, setVisibleHidden] = useState<Set<TabKey>>(() => {
    try {
      const raw = localStorage.getItem(VISIBLE_HIDDEN_TABS_KEY)
      return new Set(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set()
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const editRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editOpen) return
    function onDocClick(e: MouseEvent) {
      if (editRef.current && !editRef.current.contains(e.target as Node)) setEditOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [editOpen])

  function switchTab(key: TabKey) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', key)
      if (key !== '항차검색' && key !== '결제') next.delete('voyage')
      return next
    })
  }

  function toggleTabVisibility(key: TabKey) {
    setVisibleHidden(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        if (activeTab === key) switchTab('상품등록')
      } else {
        next.add(key)
      }
      localStorage.setItem(VISIBLE_HIDDEN_TABS_KEY, JSON.stringify([...next]))
      return next
    })
  }

  return (
    <div className="flex flex-col">
      {/* 탭 바 */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <nav className="flex flex-1 overflow-x-auto scrollbar-none px-4" aria-label="항차 마스터 탭">
            {TABS
              .filter(t => !HIDDEN_TAB_KEYS.includes(t.key) || visibleHidden.has(t.key))
              .map(t => (
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

          {/* 탭 편집 — 숨긴 탭을 개별적으로 다시 불러오기 */}
          <div className="relative shrink-0 px-1" ref={editRef}>
            <button
              type="button"
              onClick={() => setEditOpen(o => !o)}
              title="탭 편집"
              className={[
                'flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition',
                editOpen ? 'bg-slate-100 text-brand' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
              ].join(' ')}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:block">탭 편집</span>
            </button>
            {editOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
                <p className="px-3 py-1 text-[11px] font-semibold text-slate-400">숨긴 탭 불러오기</p>
                {HIDDEN_TAB_KEYS.map(key => {
                  const label = TABS.find(t => t.key === key)?.label ?? key
                  return (
                    <label key={key} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={visibleHidden.has(key)}
                        onChange={() => toggleTabVisibility(key)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand"
                      />
                      {label}
                    </label>
                  )
                })}
              </div>
            )}
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
