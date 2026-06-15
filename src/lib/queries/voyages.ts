import { supabase } from '../supabase'
import type { Voyage, Flight, ItineraryDay, CancellationPolicy, HistoryLog, Hotel } from '../../types/database'
import type { VoyageFormValues } from '../schemas/voyage'

type VoyageRef = Pick<Voyage, 'region' | 'departure_date'>
export type FlightRow = Flight & { voyages: VoyageRef }
export type ItineraryRow = ItineraryDay & { voyages: VoyageRef }
export type CancellationRow = CancellationPolicy & { voyages: VoyageRef }
export type HistoryRow = HistoryLog & { voyages: VoyageRef }
export type HotelRow = Hotel & { voyages: VoyageRef }

function sb() {
  if (!supabase) throw new Error('Supabase 클라이언트 미초기화')
  return supabase
}

// ── Voyages ───────────────────────────────────────────────────────────────

export async function fetchVoyages(): Promise<Voyage[]> {
  const { data, error } = await sb()
    .from('voyages')
    .select('*')
    .order('departure_date', { ascending: false })
  if (error) throw error
  return data as Voyage[]
}

export async function fetchVoyage(id: string): Promise<Voyage> {
  const { data, error } = await sb()
    .from('voyages')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Voyage
}

// ── Child tables ──────────────────────────────────────────────────────────

export async function fetchFlights(voyageId: string): Promise<Flight[]> {
  const { data, error } = await sb()
    .from('flights')
    .select('*')
    .eq('voyage_id', voyageId)
    .order('sort_order')
  if (error) throw error
  return data as Flight[]
}

export async function fetchItinerary(voyageId: string): Promise<ItineraryDay[]> {
  const { data, error } = await sb()
    .from('itinerary_days')
    .select('*')
    .eq('voyage_id', voyageId)
    .order('sort_order')
  if (error) throw error
  return data as ItineraryDay[]
}

export async function fetchCancellationPolicies(voyageId: string): Promise<CancellationPolicy[]> {
  const { data, error } = await sb()
    .from('cancellation_policies')
    .select('*')
    .eq('voyage_id', voyageId)
    .order('sort_order')
  if (error) throw error
  return data as CancellationPolicy[]
}

export async function fetchHistory(voyageId: string): Promise<HistoryLog[]> {
  const { data, error } = await sb()
    .from('history_logs')
    .select('*')
    .eq('voyage_id', voyageId)
    .order('logged_at', { ascending: false })
  if (error) throw error
  return data as HistoryLog[]
}

export async function addHistoryLog(
  voyageId: string,
  content: string,
  author: string
): Promise<HistoryLog> {
  const { data, error } = await sb()
    .from('history_logs')
    .insert({ voyage_id: voyageId, content, author })
    .select()
    .single()
  if (error) throw error
  return data as HistoryLog
}

// ── Create ────────────────────────────────────────────────────────────────

export async function createVoyageWithChildren(values: VoyageFormValues): Promise<Voyage> {
  const { flights, itinerary, policies, ...voyageData } = values

  const { data: voyage, error: ve } = await sb()
    .from('voyages')
    .insert(voyageData)
    .select()
    .single()
  if (ve) throw ve

  const id = (voyage as Voyage).id

  if (flights.length > 0) {
    const { error } = await sb()
      .from('flights')
      .insert(flights.map((f, i) => ({ ...f, voyage_id: id, sort_order: f.sort_order || i + 1 })))
    if (error) throw error
  }

  if (itinerary.length > 0) {
    const { error } = await sb()
      .from('itinerary_days')
      .insert(itinerary.map((d, i) => ({ ...d, voyage_id: id, sort_order: d.sort_order || i + 1 })))
    if (error) throw error
  }

  if (policies.length > 0) {
    const { error } = await sb()
      .from('cancellation_policies')
      .insert(policies.map((p, i) => ({ ...p, voyage_id: id, sort_order: p.sort_order || i + 1 })))
    if (error) throw error
  }

  return voyage as Voyage
}

// ── All-data queries (master tabs) ───────────────────────────────────────

export async function fetchAllFlights(): Promise<FlightRow[]> {
  const { data, error } = await sb()
    .from('flights')
    .select('*, voyages(region, departure_date)')
    .order('sort_order')
  if (error) throw error
  return data as FlightRow[]
}

export async function fetchAllItinerary(): Promise<ItineraryRow[]> {
  const { data, error } = await sb()
    .from('itinerary_days')
    .select('*, voyages(region, departure_date)')
    .order('sort_order')
  if (error) throw error
  return data as ItineraryRow[]
}

export async function fetchAllCancellationPolicies(): Promise<CancellationRow[]> {
  const { data, error } = await sb()
    .from('cancellation_policies')
    .select('*, voyages(region, departure_date)')
    .order('sort_order')
  if (error) throw error
  return data as CancellationRow[]
}

export async function fetchAllHistoryLogs(): Promise<HistoryRow[]> {
  const { data, error } = await sb()
    .from('history_logs')
    .select('*, voyages(region, departure_date)')
    .order('logged_at', { ascending: false })
  if (error) throw error
  return data as HistoryRow[]
}

export async function fetchAllHotels(): Promise<HotelRow[]> {
  const { data, error } = await sb()
    .from('hotels')
    .select('*, voyages(region, departure_date)')
    .order('sort_order')
  if (error) throw error
  return data as HotelRow[]
}

// ── Hotel CRUD ─────────────────────────────────────────────────────────────

export async function addHotel(
  voyageId: string,
  hotel: Omit<Hotel, 'id' | 'voyage_id' | 'created_at'>
): Promise<Hotel> {
  const { data, error } = await sb()
    .from('hotels')
    .insert({ ...hotel, voyage_id: voyageId })
    .select()
    .single()
  if (error) throw error
  return data as Hotel
}

export async function deleteHotel(id: string): Promise<void> {
  const { error } = await sb().from('hotels').delete().eq('id', id)
  if (error) throw error
}

// ── Voyage update ─────────────────────────────────────────────────────────

export async function updateVoyage(
  id: string,
  patch: Partial<Omit<Voyage, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Voyage> {
  const { data, error } = await sb()
    .from('voyages')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Voyage
}

// ── Flight CRUD ─────────────────────────────────────────────────────────────

type FlightInput = Omit<Flight, 'id' | 'voyage_id' | 'created_at'>

export async function saveFlight(
  voyageId: string,
  data: FlightInput,
  id?: string,
): Promise<Flight> {
  if (id) {
    const { data: row, error } = await sb()
      .from('flights')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as Flight
  }
  const { data: row, error } = await sb()
    .from('flights')
    .insert({ ...data, voyage_id: voyageId })
    .select()
    .single()
  if (error) throw error
  return row as Flight
}

export async function deleteFlightRow(id: string): Promise<void> {
  const { error } = await sb().from('flights').delete().eq('id', id)
  if (error) throw error
}

// ── ItineraryDay CRUD ─────────────────────────────────────────────────────

type ItineraryDayInput = Omit<ItineraryDay, 'id' | 'voyage_id'>

export async function saveItineraryDay(
  voyageId: string,
  data: ItineraryDayInput,
  id?: string,
): Promise<ItineraryDay> {
  if (id) {
    const { data: row, error } = await sb()
      .from('itinerary_days')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as ItineraryDay
  }
  const { data: row, error } = await sb()
    .from('itinerary_days')
    .insert({ ...data, voyage_id: voyageId })
    .select()
    .single()
  if (error) throw error
  return row as ItineraryDay
}

export async function deleteItineraryDay(id: string): Promise<void> {
  const { error } = await sb().from('itinerary_days').delete().eq('id', id)
  if (error) throw error
}

// ── CancellationPolicy CRUD ───────────────────────────────────────────────

type CancellationPolicyInput = Omit<CancellationPolicy, 'id' | 'voyage_id'>

export async function saveCancellationPolicy(
  voyageId: string,
  data: CancellationPolicyInput,
  id?: string,
): Promise<CancellationPolicy> {
  if (id) {
    const { data: row, error } = await sb()
      .from('cancellation_policies')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as CancellationPolicy
  }
  const { data: row, error } = await sb()
    .from('cancellation_policies')
    .insert({ ...data, voyage_id: voyageId })
    .select()
    .single()
  if (error) throw error
  return row as CancellationPolicy
}

export async function deleteCancellationPolicy(id: string): Promise<void> {
  const { error } = await sb().from('cancellation_policies').delete().eq('id', id)
  if (error) throw error
}

// ── Duplicate ─────────────────────────────────────────────────────────────

export async function duplicateVoyage(voyageId: string): Promise<Voyage> {
  const [voyage, flights, itinerary, policies] = await Promise.all([
    fetchVoyage(voyageId),
    fetchFlights(voyageId),
    fetchItinerary(voyageId),
    fetchCancellationPolicies(voyageId),
  ])

  const { id, created_at, updated_at, ...base } = voyage
  const { data: newVoyage, error } = await sb()
    .from('voyages')
    .insert({ ...base, customer_count: 0, status: '미오픈' })
    .select()
    .single()
  if (error) throw error

  const newId = (newVoyage as Voyage).id

  if (flights.length > 0) {
    await sb().from('flights').insert(
      flights.map(({ id: _id, voyage_id: _vid, created_at: _ca, ...f }) => ({ ...f, voyage_id: newId }))
    )
  }
  if (itinerary.length > 0) {
    await sb().from('itinerary_days').insert(
      itinerary.map(({ id: _id, voyage_id: _vid, ...d }) => ({ ...d, voyage_id: newId }))
    )
  }
  if (policies.length > 0) {
    await sb().from('cancellation_policies').insert(
      policies.map(({ id: _id, voyage_id: _vid, ...p }) => ({ ...p, voyage_id: newId }))
    )
  }

  return newVoyage as Voyage
}
