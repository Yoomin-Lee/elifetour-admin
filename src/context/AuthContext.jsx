import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseReady) { setLoading(false); return }

    let settled = false

    function settle(session) {
      if (settled) return
      settled = true
      setUser(session?.user ?? null)
      setLoading(false)
    }

    // onAuthStateChange를 먼저 등록 — URL hash의 implicit 토큰도 여기서 처리됨
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!settled) {
        settle(session)
      } else {
        setUser(session?.user ?? null)
      }
    })

    // fallback: onAuthStateChange가 이벤트를 발생시키지 않을 경우
    supabase.auth.getSession().then(({ data }) => settle(data.session))

    return () => subscription.unsubscribe()
  }, [])

  const signInWith = (provider) => {
    if (!isSupabaseReady) {
      alert('Supabase가 설정되지 않았습니다. .env.local 을 확인하세요.')
      return
    }
    return supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/elifetour-admin` },
    })
  }

  const signOut = () => isSupabaseReady && supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signInWith, signOut, isSupabaseReady }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
