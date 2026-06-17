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
  row_type: 'rule' | 'tip'
  rows: MnRow[]
  sort_order: number
}

function sb() {
  if (!supabase) throw new Error('Supabase 클라이언트 미초기화')
  return supabase
}

export async function fetchMnSections(): Promise<MnSection[]> {
  const { data, error } = await sb()
    .from('mn_sections')
    .select('*')
    .order('sort_order')
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

export async function deleteMnSection(id: string): Promise<void> {
  const { error } = await sb().from('mn_sections').delete().eq('id', id)
  if (error) throw error
}
