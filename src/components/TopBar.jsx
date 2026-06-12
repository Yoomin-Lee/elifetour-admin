import { useAuth } from '../context/AuthContext'

const ROLE_LABEL = { admin: '관리자', staff: '직원', escort: '인솔자' }
const ROLE_COLOR = {
  admin:  'bg-blue-100 text-blue-700',
  staff:  'bg-slate-100 text-slate-600',
  escort: 'bg-emerald-100 text-emerald-700',
}

export default function TopBar({ onMenuClick }) {
  const { user, role, signOut } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        onClick={onMenuClick}
        aria-label="메뉴 열기"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-3">
        {user?.user_metadata?.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt="프로필"
            className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-200"
          />
        )}
        <div className="hidden text-right sm:block">
          <div className="flex items-center justify-end gap-1.5">
            <p className="text-sm font-semibold text-slate-800 leading-none">
              {user?.user_metadata?.name || user?.email?.split('@')[0] || '직원'}
            </p>
            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${ROLE_COLOR[role] ?? ROLE_COLOR.staff}`}>
              {ROLE_LABEL[role] ?? '직원'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
