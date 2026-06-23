import { supabase, t } from './supabase'

export async function getPassengers(tripId: string) {
  const { data, error } = await supabase
    .from(t('passengers'))
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getPassengersByTrip(tripId: string) {
  const { data, error } = await supabase
    .from(t('passengers'))
    .select(`*, ${t('trips')}(title, depart_date, destination)`)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getPassengersByVoyage(voyageId: string) {
  const { data, error } = await supabase
    .from(t('passengers'))
    .select('*')
    .eq('voyage_id', voyageId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function searchPassengers(query: string) {
  const { data, error } = await supabase
    .from(t('passengers'))
    .select(`*, ${t('trips')}(title, depart_date, destination)`)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%,passport_no.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as unknown as Record<string, unknown>[]
}

export async function createPassenger(passenger: Record<string, unknown>) {
  const { data, error } = await supabase
    .from(t('passengers'))
    .insert(passenger)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePassenger(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from(t('passengers'))
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePassenger(id: string) {
  const { error } = await supabase.from(t('passengers')).delete().eq('id', id)
  if (error) throw error
}

export async function getPassengerCount(tripId: string) {
  const { count, error } = await supabase
    .from(t('passengers'))
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
  if (error) throw error
  return count ?? 0
}

export async function getTotalPassengersThisMonth() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count, error } = await supabase
    .from(t('passengers'))
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start)
  if (error) return 0
  return count ?? 0
}
