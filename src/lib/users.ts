import { supabase } from './supabase'

export async function getProfiles() {
  const { data, error } = await supabase
    .from('eli_profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function updateProfileRole(id: string, role: string) {
  const { data, error } = await supabase
    .from('eli_profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(id: string, fields: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('eli_profiles')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function approveProfile(id: string, role = 'staff') {
  const { data, error } = await supabase
    .from('eli_profiles')
    .update({ status: 'approved', role })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
