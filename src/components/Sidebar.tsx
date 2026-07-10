import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  end?: boolean
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: '대시보드',
    end: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
]

const voyageNavItems: NavItem[] = [
  {
    to: '/voyages',
    label: '항차 마스터',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 10l4-6h10l4 6M3 10l1 8h16l1-8M9 14h6" />
      </svg>
    ),
  },
]

const adminNavItems: NavItem[] = [
  {
    to: '/export',
    label: '엑셀 내보내기',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
      </svg>
    ),
  },
  {
    to: '/users',
    label: '직원 관리',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

function SidebarLink({
  to, end, isActive: forceActive, icon, label, expanded, onClick,
}: {
  to: string
  end?: boolean
  isActive?: boolean
  icon: React.ReactNode
  label: string
  expanded: boolean
  onClick?: () => void
}) {
  const linkClass = (active: boolean) => [
    'flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition',
    expanded ? 'px-3' : 'justify-center px-0',
    active ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
  ].join(' ')

  const link = forceActive !== undefined ? (
    <NavLink to={to} onClick={onClick} className={linkClass(forceActive)}>
      {icon}
      {expanded && label}
    </NavLink>
  ) : (
    <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => linkClass(isActive)}>
      {icon}
      {expanded && label}
    </NavLink>
  )

  if (expanded) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

const HOVER_EXPAND_DELAY_MS = 250

export default function Sidebar({
  open, onClose, pinned, onTogglePinned,
}: {
  open: boolean
  onClose: () => void
  pinned: boolean
  onTogglePinned: () => void
}) {
  const { isAdmin } = useAuth()
  const location = useLocation()
  const isCalendarActive = location.pathname === '/voyages' &&
    new URLSearchParams(location.search).get('tab') === '달력'

  const [hovering, setHovering] = useState(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expanded = pinned || hovering

  useEffect(() => () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
  }, [])

  function handleMouseEnter() {
    if (pinned) return
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setHovering(true), HOVER_EXPAND_DELAY_MS)
  }

  function handleMouseLeave() {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null }
    setHovering(false)
  }

  // 메뉴 클릭으로 페이지 이동 시 — 고정(pinned)된 게 아니면 바로 접힘 상태로 되돌린다
  function handleNavClick() {
    onClose()
    if (!pinned) {
      if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null }
      setHovering(false)
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      {/* 레이아웃에서 차지하는 실제 폭 — 고정 여부에만 반응하고, 호버 중엔 그대로 유지(오버레이는 안쪽 레이어가 담당) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 lg:relative lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          pinned ? 'lg:w-64' : 'lg:w-20',
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={cn(
            'flex h-full w-64 flex-col bg-sidebar transition-[width] duration-200',
            pinned
              ? 'lg:w-64'
              : hovering
                ? 'lg:absolute lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:shadow-2xl'
                : 'lg:w-20',
          )}
        >
          <div className={`flex h-16 items-center justify-between px-5 ${!expanded ? 'lg:justify-center lg:px-0' : ''}`}>
            <div className={`flex flex-col gap-1.5 ${!expanded ? 'lg:hidden' : ''}`}>
              <img
                src="/logo-full.png"
                alt="이라이프투어"
                className="h-7 w-auto object-contain object-left brightness-0 invert"
              />
              <div className="flex items-center gap-2">
                <div className="h-px w-3 bg-white/30 rounded-full" />
                <span className="text-[9px] font-light tracking-[0.22em] text-white/40 leading-none whitespace-nowrap">
                  ETIS
                </span>
                <div className="h-px flex-1 bg-white/10 rounded-full" />
              </div>
            </div>
            {!expanded && (
              <img
                src="/favicon.png"
                alt="이라이프투어"
                className="hidden h-8 w-8 rounded-md object-contain lg:block"
              />
            )}
            <button
              type="button"
              className="rounded p-1 text-white/60 hover:text-white lg:hidden"
              onClick={onClose}
              aria-label="메뉴 닫기"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mx-4 border-t border-white/10" />

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <SidebarLink key={item.to} to={item.to} end={item.end} icon={item.icon} label={item.label} expanded={expanded} onClick={handleNavClick} />
            ))}

            <div className="mx-1 my-3 border-t border-white/10" />
            <p className={`px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30 ${!expanded ? 'lg:hidden' : ''}`}>
              항차 관리
            </p>
            {voyageNavItems.map((item) => (
              <SidebarLink key={item.to} to={item.to} end icon={item.icon} label={item.label} expanded={expanded} onClick={handleNavClick} />
            ))}
            <SidebarLink
              to="/voyages?tab=%EB%8B%AC%EB%A0%A5"
              isActive={isCalendarActive}
              expanded={expanded}
              onClick={handleNavClick}
              label="일정 달력"
              icon={
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />

            {isAdmin && (
              <>
                <div className="mx-1 my-3 border-t border-white/10" />
                <p className={`px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30 ${!expanded ? 'lg:hidden' : ''}`}>
                  관리자
                </p>
                {adminNavItems.map((item) => (
                  <SidebarLink key={item.to} to={item.to} icon={item.icon} label={item.label} expanded={expanded} onClick={handleNavClick} />
                ))}
              </>
            )}
          </nav>

          <button
            type="button"
            onClick={onTogglePinned}
            title={pinned ? '고정 해제 (호버로만 펼치기)' : '펼침 고정'}
            className="hidden items-center justify-center gap-2 border-t border-white/10 py-3 text-white/50 hover:bg-white/10 hover:text-white transition lg:flex"
          >
            <svg className={`h-4 w-4 transition-transform ${!pinned ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {expanded && <span className="text-xs font-medium">{pinned ? '고정됨' : '접기'}</span>}
          </button>

          <div className={`px-5 py-4 border-t border-white/10 ${!expanded ? 'lg:hidden' : ''}`}>
            <p className="text-xs text-white/40 whitespace-nowrap">© 2014 이라이프투어</p>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
