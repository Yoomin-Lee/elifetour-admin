import { supabase } from '@/lib/supabase'

export type CancellationPolicy = {
  category: string
  start_d_minus: number | null
  end_d_minus: number | null
  fee_description: string
  fee_type: 'percent' | 'fixed' | 'free' | null
  fee_value: number | null
  fee_unit: string
  note: string
  sort_order: number
}

export type CancellationPresetDB = {
  id: string
  label: string
  policies: CancellationPolicy[]
  sort_order: number
  created_at: string
  updated_at: string
}

const TABLE = 'eli_cancellation_presets'

export async function fetchCancellationPresets(): Promise<CancellationPresetDB[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as CancellationPresetDB[]
}

export async function createCancellationPreset(
  payload: Omit<CancellationPresetDB, 'id' | 'created_at' | 'updated_at'>
): Promise<CancellationPresetDB> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as CancellationPresetDB
}

export async function updateCancellationPreset(
  id: string,
  payload: Partial<Omit<CancellationPresetDB, 'id' | 'created_at' | 'updated_at'>>
): Promise<CancellationPresetDB> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as CancellationPresetDB
}

export async function deleteCancellationPreset(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
