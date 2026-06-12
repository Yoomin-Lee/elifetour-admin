import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseReady) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
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
