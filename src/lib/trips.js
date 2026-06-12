import { supabase, t } from './supabase'

export async function getTrips({ status, search, limit = 100 } = {}) {
  let q = supabase.from(t('trips')).select('*').order('depart_date', { ascending: true }).limit(limit)
  if (status) q = q.eq('status', status)
  if (search) q = q.ilike('title', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getTripById(id) {
  const { data, error } = await supabase.from(t('trips')).select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createTrip(trip, userId) {
  const { data, error } = await supabase
    .from(t('trips'))
    .insert({ ...trip, created_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTrip(id, updates) {
  const { data, error } = await supabase
    .from(t('trips'))
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTrip(id) {
  const { error } = await supabase.from(t('trips')).delete().eq('id', id)
  if (error) throw error
}

export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0]
  const [upcomingRes, ongoingRes, totalRes] = await Promise.all([
    supabase.from(t('trips')).select('id', { count: 'exact', head: true }).eq('status', 'upcoming'),
    supabase.from(t('trips')).select('id', { count: 'exact', head: true }).eq('status', 'ongoing'),
    supabase.from(t('trips')).select('id', { count: 'exact', head: true }),
  ])
  return {
    upcoming: upcomingRes.count ?? 0,
    ongoing: ongoingRes.count ?? 0,
    total: totalRes.count ?? 0,
  }
}
