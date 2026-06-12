import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseReady = Boolean(url && anon)
export const supabase = isSupabaseReady
  ? createClient(url, anon, {
      auth: {
        detectSessionInUrl: false,  // AuthCallback이 직접 교환, 자동감지 충돌 방지
        persistSession: true,
      },
    })
  : null

export const TABLE_PREFIX = import.meta.env.VITE_TABLE_PREFIX || 'eli_'
export const t = (name) => `${TABLE_PREFIX}${name}`
