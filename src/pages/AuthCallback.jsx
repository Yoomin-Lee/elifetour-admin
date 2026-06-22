import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        const search = new URLSearchParams(window.location.search)
        const hash   = new URLSearchParams(window.location.hash.slice(1))

        // 에러 먼저 확인
        const errCode = search.get('error') || hash.get('error')
        const errDesc = search.get('error_description') || hash.get('error_description')
        if (errCode) throw new Error(errDesc || errCode)

        const code         = search.get('code')
        const accessToken  = hash.get('access_token')
        const refreshToken = hash.get('refresh_token') || ''

        if (code) {
          // PKCE flow: query string에 code
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (accessToken) {
          // Implicit flow: hash에 access_token
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (error) throw error
        } else {
          throw new Error('인증 정보를 찾을 수 없습니다 — URL: ' + window.location.href)
        }

        navigate('/voyages?tab=상품등록', { replace: true })
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
