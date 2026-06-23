import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const isSupabaseReady = Boolean(url && anon)
export const supabase: SupabaseClient = isSupabaseReady
  ? createClient(url, anon, {
      auth: {
        detectSessionInUrl: false,
        persistSession: true,
      },
    })
  : (null as unknown as SupabaseClient)

export const TABLE_PREFIX = (import.meta.env.VITE_TABLE_PREFIX as string) || 'eli_'
export const t = (name: string): string => `${TABLE_PREFIX}${name}`
