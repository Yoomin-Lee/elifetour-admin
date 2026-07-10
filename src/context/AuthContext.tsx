import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseReady } from '../lib/supabase'

interface Profile {
  id: string
  role: 'admin' | 'staff' | 'escort'
  status: string
  display_name?: string | null
  avatar_url?: string | null
  email?: string | null
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  role: 'admin' | 'staff' | 'escort'
  status: string
  isAdmin: boolean
  isEscort: boolean
  canWrite: boolean
  isPending: boolean
  loading: boolean
  signInWith: (provider: string) => void | Promise<unknown>
  signOut: () => Promise<void>
  isSupabaseReady: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string | null) {
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

    async function settle(session: { user: User } | null) {
      if (settled) return
      settled = true
      setUser(session?.user ?? null)
      await fetchProfile(session?.user?.id ?? null)
      setLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

  const signInWith = (provider: string) => {
    if (!isSupabaseReady) { alert('Supabase가 설정되지 않았습니다.'); return }
    return supabase.auth.signInWithOAuth({
      provider: provider as 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    if (isSupabaseReady) await supabase.auth.signOut()
  }

  const role = (profile?.role ?? 'staff') as 'admin' | 'staff' | 'escort'
  const status = profile?.status ?? 'pending'
  const isAdmin = role === 'admin'
  const isEscort = role === 'escort'
  const canWrite = isAdmin
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

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
