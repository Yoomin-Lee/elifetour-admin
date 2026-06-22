import { supabase } from '@/lib/supabase'

export type PresetPort = {
  port: string
  arrival_time: string
  departure_time: string
  summary: string
}

export type ItineraryPreset = {
  id: string
  label: string
  nights: number | null
  ports: PresetPort[]
  sort_order: number
  created_at: string
  updated_at: string
}

const TABLE = 'eli_itinerary_presets'

export async function fetchItineraryPresets(): Promise<ItineraryPreset[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as ItineraryPreset[]
}

export async function createItineraryPreset(
  payload: Omit<ItineraryPreset, 'id' | 'created_at' | 'updated_at'>
): Promise<ItineraryPreset> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as ItineraryPreset
}

export async function updateItineraryPreset(
  id: string,
  payload: Partial<Omit<ItineraryPreset, 'id' | 'created_at' | 'updated_at'>>
): Promise<ItineraryPreset> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ItineraryPreset
}

export async function deleteItineraryPreset(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
