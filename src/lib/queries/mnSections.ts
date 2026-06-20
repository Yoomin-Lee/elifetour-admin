import { supabase } from '../supabase'

export type MnRow = {
  d?: string
  fee?: string
  note?: string
  room?: string
  amount?: string
}

export type MnSection = {
  id: string
  category: string
  title: string
  description: string | null
  reference_url: string | null
  row_type: 'rule' | 'tip'
  rows: MnRow[]
  sort_order: number
  deleted_at?: string | null
}

function sb() {
  if (!supabase) throw new Error('Supabase 클라이언트 미초기화')
  return supabase
}

export async function fetchMnSections(): Promise<MnSection[]> {
  const { data, error } = await sb()
    .from('mn_sections')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order')
  if (error) throw error
  return data as MnSection[]
}

export async function fetchDeletedMnSections(): Promise<MnSection[]> {
  const { data, error } = await sb()
    .from('mn_sections')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw error
  return data as MnSection[]
}

export async function upsertMnSection(section: Omit<MnSection, 'id'> & { id?: string }): Promise<MnSection> {
  const { data, error } = await sb()
    .from('mn_sections')
    .upsert({ ...section, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data as MnSection
}

export async function softDeleteMnSection(id: string): Promise<void> {
  const { error } = await sb()
    .from('mn_sections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function restoreMnSection(id: string): Promise<void> {
  const { error } = await sb()
    .from('mn_sections')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) throw error
}

export async function hardDeleteMnSection(id: string): Promise<void> {
  const { error } = await sb().from('mn_sections').delete().eq('id', id)
  if (error) throw error
}
