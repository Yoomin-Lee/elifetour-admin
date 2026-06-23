import { supabase } from '../supabase'

export type RegionOption = {
  id: string
  label: string
  sort_order: number
}

function sb() {
  if (!supabase) throw new Error('Supabase 클라이언트 미초기화')
  return supabase
}

export async function fetchRegionOptions(): Promise<RegionOption[]> {
  const { data, error } = await sb()
    .from('region_options')
    .select('id, label, sort_order')
    .order('sort_order')
  if (error) throw error
  return data as RegionOption[]
}

export async function addRegionOption(label: string): Promise<RegionOption> {
  const { data, error } = await sb()
    .from('region_options')
    .insert({ label, sort_order: 99 })
    .select()
    .single()
  if (error) throw error
  return data as RegionOption
}

export async function deleteRegionOption(id: string): Promise<void> {
  const { error } = await sb().from('region_options').delete().eq('id', id)
  if (error) throw error
}

export async function updateRegionOption(id: string, label: string): Promise<void> {
  const { error } = await sb().from('region_options').update({ label }).eq('id', id)
  if (error) throw error
}
