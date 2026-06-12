import { supabase } from './supabase'

export async function getProfiles() {
  const { data, error } = await supabase
    .from('eli_profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function updateProfileRole(id, role) {
  const { data, error } = await supabase
    .from('eli_profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
