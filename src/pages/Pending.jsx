import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Pending() {
  const { user, isPending, loading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true })
    if (!loading && user && !isPending) navigate('/', { replace: true })
  }, [loading, user, isPending, navigate])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
            ⏳
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">승인 대기 중입니다</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            관리자가 계정을 승인하면 서비스를 이용하실 수 있습니다.
            <br />
            담당 관리자에게 문의해 주세요.
          </p>
        </div>

        {user?.email && (
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {user.email}
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
