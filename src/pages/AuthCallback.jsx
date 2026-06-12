import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (!code) throw new Error('인증 코드 없음 — URL: ' + window.location.href)

        const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code)
        if (exchErr) throw exchErr

        const { data } = await supabase.auth.getSession()
        if (!data.session) throw new Error('세션 생성 실패 (exchange 후 getSession null)')

        navigate('/', { replace: true })
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err.message || '로그인 처리 중 오류가 발생했습니다.')
        setTimeout(() => navigate('/login', { replace: true }), 3000)
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-medium mb-2">로그인 오류</p>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <p className="text-slate-400 text-xs">3초 후 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C8A] border-t-transparent mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Google 로그인 처리 중...</p>
      </div>
    </div>
  )
}
