import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Ship, Anchor, Users, CreditCard, ChevronDown, Settings, X, Plus, AlertCircle, GripVertical, Clock, Lock, Flag, List, Layers } from 'lucide-react'
import { fetchVoyageDashboardData } from '../lib/queries/voyages'

const NAVY_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20'><path d='M3,2 L3,16 L6,12 L8,17 L10,16 L8,11 L13,11 Z' fill='%23172554' stroke='white' stroke-width='1.5' stroke-linejoin='round'/></svg>") 3 2, default`

// 사용 가능한 카드 전체 목록
const CARD_DEFS = [
  { id: 'on-sale',            label: '판매중 항차',      icon: Ship,         color: 'purple',  link: '/voyages?tab=상품등록&status=판매중'         },
  { id: 'total-customers',    label: '총 예약 인원',     icon: Users,        color: 'blue'                                                         },
  { id: 'this-month-departs', label: '이번달 출발',      icon: Anchor,       color: 'cyan',    link: '/voyages?tab=상품등록&filter=this-month'     },
  { id: 'this-month-pay',     label: '이번달 결제 마감', icon: CreditCard,   color: 'orange',  link: '/voyages?tab=결제&filter=this-month'         },
  { id: 'overdue',            label: '연체 결제',        icon: AlertCircle,  color: 'red',     link: '/voyages?tab=결제'                           },
  { id: 'status-미오픈',      label: '미오픈 항차',      icon: Clock,        color: 'slate',   link: '/voyages?tab=상품등록&status=미오픈'         },
  { id: 'status-마감',        label: '마감 항차',        icon: Lock,         color: 'orange',  link: '/voyages?tab=상품등록&status=마감'           },
  { id: 'status-출발완료',    label: '출발완료 항차',    icon: Flag,         color: 'green',   link: '/voyages?tab=상품등록&status=출발완료'       },
  { id: 'total-voyages',      label: '전체 항차 수',     icon: List,         color: 'blue',    link: '/voyages?tab=상품등록'                       },
  { id: 'cabin-remaining',    label: '총 잔여 객실',     icon: Layers,       color: 'emerald'                                                      },
]

const DEFAULT_IDS = ['this-month-departs', 'on-sale', 'this-month-pay', 'status-미오픈']
const STORAGE_KEY = 'elifetour_dashboard_cards'

function loadSavedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const ids = JSON.parse(raw)
      const valid = ids.filter(id => CARD_DEFS.some(d => d.id === id))
      if (valid.length > 0) return valid
    }
  } catch {}
  return DEFAULT_IDS
}

function getCardProps(id, { onSaleVoyages, thisMonthDepartures, thisMonthPayments, totalCustomers, overdueCount, statusCounts, loading }) {
  switch (id) {
    case 'on-sale':
      return { value: loading ? '…' : onSaleVoyages.length }
    case 'total-customers':
      return { value: loading ? '…' : `${totalCustomers.toLocaleString('ko-KR')}명` }
    case 'this-month-departs':
      return { value: loading ? '…' : thisMonthDepartures.length }
    case 'this-month-pay':
      return {
        value: loading ? '…' : thisMonthPayments.length,
        color: overdueCount > 0 ? 'red' : undefined,
        sub: overdueCount > 0 ? `연체 ${overdueCount}건` : null,
      }
    case 'overdue':
      return { value: loading ? '…' : `${overdueCount}건` }
    case 'status-미오픈':
      return { value: loading ? '…' : (statusCounts['미오픈'] ?? 0) }
    case 'status-마감':
      return { value: loading ? '…' : (statusCounts['마감'] ?? 0) }
    case 'status-출발완료':
      return { value: loading ? '…' : (statusCounts['출발완료'] ?? 0) }
    case 'total-voyages':
      return { value: loading ? '…' : Object.values(statusCounts).reduce((s, n) => s + n, 0) }
    case 'cabin-remaining':
      return { value: loading ? '…' : `${onSaleVoyages.reduce((s, v) => s + (v.cabin_remaining ?? 0), 0)}석` }
    default:
      return {}
  }
}

function StatCard({ label, value, icon: Icon, color, sub, link }) {
  const colors = {
    blue:    'bg-blue-50 text-blue-600',
    orange:  'bg-orange-50 text-orange-600',
    purple:  'bg-purple-50 text-purple-600',
    cyan:    'bg-cyan-50 text-cyan-600',
    red:     'bg-red-50 text-red-600',
    green:   'bg-green-50 text-green-600',
    slate:   'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }
  const inner = (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-amber-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  return link ? <Link to={link} style={{ cursor: NAVY_CURSOR }} className="block hover:opacity-90 transition">{inner}</Link> : inner
}

function SectionHeader({ title, badge, link, linkLabel }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        {badge}
      </div>
      {link && (
        <Link to={link} className="text-sm font-medium text-brand hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

function Empty({ message }) {
  return (
    <div className="flex items-center justify-center py-10 text-slate-400 text-sm">{message}</div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-700">{value || '-'}</p>
    </div>
  )
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function formatAmount(amount, currency) {
  if (!amount) return '-'
  const sym = { KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥' }
  const prefix = sym[currency] ?? (currency + ' ')
  return prefix + Number(amount).toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
}

function cabinBadge(remaining, total) {
  if (total === 0) return { text: '-', cls: 'text-slate-400' }
  if (remaining === 0) return { text: '마감', cls: 'text-red-500 font-semibold' }
  const cls = remaining / total > 0.2 ? 'text-emerald-600' : 'text-amber-600 font-medium'
  return { text: `${remaining} / ${total}석`, cls }
}

function isOverdue(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dateStr) < today
}

export default function Dashboard() {
  const [dash, setDash]         = useState({ onSaleVoyages: [], thisMonthDepartures: [], thisMonthPayments: [], statusCounts: {} })
  const [loading, setLoading]   = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const [activeIds, setActiveIds] = useState(loadSavedIds)
  const [editMode, setEditMode]   = useState(false)
  const [beforeIds, setBeforeIds] = useState([])
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const addMenuRef = useRef(null)

  useEffect(() => {
    fetchVoyageDashboardData()
      .then(setDash)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // 외부 클릭 시 추가 메뉴 닫기
  useEffect(() => {
    function handleClick(e) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { onSaleVoyages, thisMonthDepartures, thisMonthPayments } = dash
  const totalCustomers = onSaleVoyages.reduce((s, v) => s + (v.customer_count || 0), 0)
  const overdueCount   = thisMonthPayments.filter(p => isOverdue(p.due_date)).length

  const { statusCounts } = dash
  const computed = { onSaleVoyages, thisMonthDepartures, thisMonthPayments, totalCustomers, overdueCount, statusCounts, loading }

  const inactiveIds = CARD_DEFS.filter(d => !activeIds.includes(d.id)).map(d => d.id)

  function removeCard(id) {
    const next = activeIds.filter(i => i !== id)
    setActiveIds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function addCard(id) {
    const next = [...activeIds, id]
    setActiveIds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setShowAddMenu(false)
  }

  function handleDrop(targetId) {
    if (!draggedId || draggedId === targetId) return
    const next = [...activeIds]
    const from = next.indexOf(draggedId)
    const to   = next.indexOf(targetId)
    next.splice(from, 1)
    next.splice(to, 0, draggedId)
    setActiveIds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setDraggedId(null)
    setDragOverId(null)
  }

  function enterEdit() {
    setBeforeIds([...activeIds])
    setEditMode(true)
  }

  function exitEdit() {
    setEditMode(false)
    setShowAddMenu(false)
    setDraggedId(null)
    setDragOverId(null)
  }

  function cancelEdit() {
    setActiveIds(beforeIds)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(beforeIds))
    exitEdit()
  }

  function toggle(id) {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">대시보드</h1>
        <p className="text-sm text-slate-500 mt-0.5">이라이프투어 항차 운영 현황</p>
      </div>

      {/* 통계 카드 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-medium text-slate-400">통계 요약</span>
          {editMode ? (
            <div className="flex items-center gap-3">
              <button
                onClick={cancelEdit}
                className="text-xs text-slate-400 hover:text-slate-600 transition"
              >
                취소
              </button>
              <button
                onClick={exitEdit}
                className="text-xs font-medium text-brand hover:underline"
              >
                완료
              </button>
            </div>
          ) : (
            <button
              onClick={enterEdit}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition"
            >
              <Settings className="h-3.5 w-3.5" />
              편집
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {activeIds.map(id => {
            const def = CARD_DEFS.find(d => d.id === id)
            if (!def) return null
            const props = getCardProps(id, computed)
            const isDragging = draggedId === id
            const isOver     = dragOverId === id && draggedId !== id
            return (
              <div
                key={id}
                className={[
                  'relative transition-all',
                  isDragging ? 'opacity-30 scale-95' : '',
                  isOver
                    ? 'ring-2 ring-brand/50 rounded-xl'
                    : editMode ? 'hover:ring-2 hover:ring-slate-800 hover:rounded-xl' : '',
                ].join(' ')}
                style={editMode ? { cursor: NAVY_CURSOR } : {}}
                draggable={editMode}
                onMouseDown={editMode ? () => {
                  document.getElementById('__drag_cursor__')?.remove()
                  const el = document.createElement('style')
                  el.id = '__drag_cursor__'
                  el.textContent = `* { cursor: ${NAVY_CURSOR} !important; }`
                  document.head.appendChild(el)
                } : undefined}
                onMouseUp={editMode ? () => {
                  document.getElementById('__drag_cursor__')?.remove()
                } : undefined}
                onDragStart={e => {
                  e.dataTransfer.setDragImage(new Image(), 0, 0)
                  setDraggedId(id)
                }}
                onDragOver={e => { e.preventDefault(); setDragOverId(id) }}
                onDrop={() => handleDrop(id)}
                onDragEnd={() => {
                  document.getElementById('__drag_cursor__')?.remove()
                  setDraggedId(null)
                  setDragOverId(null)
                }}
              >
                <StatCard
                  label={def.label}
                  icon={def.icon}
                  color={props.color ?? def.color}
                  value={props.value}
                  sub={props.sub}
                  link={editMode ? undefined : def.link}
                />
                {editMode && (
                  <>
                    <div className="pointer-events-none absolute left-2 top-2 z-10 text-slate-300">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <button
                      onClick={() => removeCard(id)}
                      className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-600 text-white shadow hover:bg-red-500 transition"
                      title="카드 제거"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            )
          })}

          {/* 편집 모드: 카드 추가 버튼 */}
          {editMode && inactiveIds.length > 0 && (
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setShowAddMenu(v => !v)}
                className="flex h-full min-h-[80px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-brand/40 hover:text-brand transition"
              >
                <Plus className="h-4 w-4" />
                카드 추가
              </button>
              {showAddMenu && (
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {inactiveIds.map(id => {
                    const def = CARD_DEFS.find(d => d.id === id)
                    if (!def) return null
                    const Icon = def.icon
                    return (
                      <button
                        key={id}
                        onClick={() => addCard(id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Icon className="h-4 w-4 text-slate-400" />
                        {def.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 판매중 항차 현황 */}
      <div>
        <div className="card overflow-hidden">
          <SectionHeader title="판매중 항차 현황" link="/voyages" linkLabel="항차 관리" />
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">불러오는 중...</div>
          ) : onSaleVoyages.length === 0 ? (
            <Empty message="판매중인 항차가 없습니다" />
          ) : (
            <div className="divide-y divide-slate-100">
              {onSaleVoyages.map((v) => {
                const cb     = cabinBadge(v.cabin_remaining, v.cabin_total)
                const isOpen = expandedId === v.id
                return (
                  <div key={v.id}>
                    <div className="flex items-center hover:bg-slate-50/60 transition">
                      <Link
                        to={`/voyages?tab=항차검색&voyage=${v.id}`}
                        className="flex flex-1 items-center gap-3 px-5 py-3.5 min-w-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{v.region}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{v.ship_name ?? '-'}</p>
                        </div>
                        <span className="shrink-0 text-sm text-slate-600 w-14 text-right">
                          {formatDate(v.departure_date)}
                        </span>
                        <span className="shrink-0 text-sm text-slate-600 w-10 text-right">
                          {v.customer_count || 0}명
                        </span>
                        <span className={`shrink-0 text-sm w-20 text-right ${cb.cls}`}>
                          {cb.text}
                        </span>
                      </Link>
                      <button
                        onClick={() => toggle(v.id)}
                        className="shrink-0 px-4 py-3.5 text-slate-400 hover:text-slate-600 transition"
                        aria-label="상세 펼치기"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {isOpen && (
                      <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                        <DetailItem label="귀국일"   value={formatDate(v.return_date)} />
                        <DetailItem label="크루즈사" value={v.cruise_line} />
                        <DetailItem label="항공사"   value={v.airline} />
                        <DetailItem label="인솔자"   value={v.tour_leader} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
