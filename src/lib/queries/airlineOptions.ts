import { supabase } from '../supabase'

export type AirlineOption = {
  id: string
  label: string
  sort_order: number
}

function sb() {
  if (!supabase) throw new Error('Supabase 클라이언트 미초기화')
  return supabase
}

export async function fetchAirlineOptions(): Promise<AirlineOption[]> {
  const { data, error } = await sb()
    .from('airline_options')
    .select('id, label, sort_order')
    .order('sort_order')
  if (error) throw error
  return data as AirlineOption[]
}

export async function addAirlineOption(label: string): Promise<AirlineOption> {
  const { data, error } = await sb()
    .from('airline_options')
    .insert({ label, sort_order: 99 })
    .select()
    .single()
  if (error) throw error
  return data as AirlineOption
}

export async function deleteAirlineOption(id: string): Promise<void> {
  const { error } = await sb().from('airline_options').delete().eq('id', id)
  if (error) throw error
}

export async function updateAirlineOption(id: string, label: string): Promise<void> {
  const { error } = await sb().from('airline_options').update({ label }).eq('id', id)
  if (error) throw error
}
