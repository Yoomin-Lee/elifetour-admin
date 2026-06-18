import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    if (!userId) { setProfile(null); return }
    const { data } = await supabase
      .from('eli_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
  }

  useEffect(() => {
    if (!isSupabaseReady) { setLoading(false); return }

    let settled = false

    async function settle(session) {
      if (settled) return
      settled = true
      setUser(session?.user ?? null)
      await fetchProfile(session?.user?.id ?? null)
      setLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!settled) {
        await settle(session)
      } else {
        setUser(session?.user ?? null)
        await fetchProfile(session?.user?.id ?? null)
      }
    })

    supabase.auth.getSession().then(({ data }) => settle(data.session))

    return () => subscription.unsubscribe()
  }, [])

  const signInWith = (provider) => {
    if (!isSupabaseReady) { alert('Supabase가 설정되지 않았습니다.'); return }
    return supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/elifetour-admin/auth/callback` },
    })
  }

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    if (isSupabaseReady) await supabase.auth.signOut()
  }

  const role = profile?.role ?? 'staff'
  const status = profile?.status ?? 'pending'
  const isAdmin = role === 'admin'
  const isEscort = role === 'escort'
  const canWrite = !isEscort
  const isPending = profile !== null && status !== 'approved'

  return (
    <AuthContext.Provider value={{
      user, profile, role, status, isAdmin, isEscort, canWrite, isPending,
      loading, signInWith, signOut, isSupabaseReady,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
