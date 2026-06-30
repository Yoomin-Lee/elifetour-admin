import { supabase } from '../supabase'
import type { Voyage, Flight, ItineraryDay, CancellationPolicy, HistoryLog, FeedbackLog, Hotel, CabinGrade, PaymentSchedule } from '../../types/database'
import type { VoyageFormValues } from '../schemas/voyage'
import { insertVoyageFlight } from './voyageFlights'

type VoyageRef = Pick<Voyage, 'region' | 'departure_date' | 'boarding_date'>
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
    .select('id, region, status, airline, airline_return, cruise_line, ship_name, departure_date, return_date, boarding_date, duration, cabin_total, cabin_remaining, customer_count, tour_leader, hotel, product_price, created_at, updated_at')
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

export async function updateHistoryLog(id: string, content: string): Promise<HistoryLog> {
  const { data, error } = await sb()
    .from('history_logs')
    .update({ content })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as HistoryLog
}

export async function deleteHistoryLog(id: string): Promise<void> {
  const { error } = await sb().from('history_logs').delete().eq('id', id)
  if (error) throw error
}

// ── Feedback ──────────────────────────────────────────────────────────────

export async function fetchFeedbackLogs(voyageId: string): Promise<FeedbackLog[]> {
  const { data, error } = await sb()
    .from('feedback_logs')
    .select('*')
    .eq('voyage_id', voyageId)
    .order('logged_at', { ascending: false })
  if (error) throw error
  return data as FeedbackLog[]
}

export async function addFeedbackLog(
  voyageId: string,
  content: string,
  author: string,
  tag: string | null
): Promise<FeedbackLog> {
  const { data, error } = await sb()
    .from('feedback_logs')
    .insert({ voyage_id: voyageId, content, author, tag })
    .select()
    .single()
  if (error) throw error
  return data as FeedbackLog
}

export async function updateFeedbackLog(id: string, content: string, tag: string | null): Promise<FeedbackLog> {
  const { data, error } = await sb()
    .from('feedback_logs')
    .update({ content, tag })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as FeedbackLog
}

export async function deleteFeedbackLog(id: string): Promise<void> {
  const { error } = await sb().from('feedback_logs').delete().eq('id', id)
  if (error) throw error
}

// ── Create ────────────────────────────────────────────────────────────────

/** "인천(ICN)" 또는 "ICN" → "ICN" */
function extractIata(str: string | null | undefined): string {
  if (!str) return ''
  const m = str.match(/\(([A-Z]{3})\)/)
  return m ? m[1] : str.trim().toUpperCase().slice(0, 3)
}

/**
 * flights 테이블 데이터를 voyage_flights 테이블에 미러링.
 * IATA 코드 추출 실패 or 날짜 누락 시 해당 구간만 스킵 (main save 영향 없음).
 */
async function mirrorFlightsToVoyageFlights(
  voyageId: string,
  flights: VoyageFormValues['flights'],
) {
  let order = 0
  for (const f of flights) {
    // segments 우선, 없으면 flat 필드를 단일 구간으로
    const segs = (f.segments ?? []).length > 0
      ? f.segments
      : (f.flight_no || f.origin || f.destination || f.departure_date)
        ? [{ flight_no: f.flight_no, origin: f.origin, destination: f.destination,
             departure_date: f.departure_date, departure_time: f.departure_time,
             arrival_date: f.arrival_date, arrival_time: f.arrival_time }]
        : []

    for (const seg of segs) {
      const dep = extractIata(seg.origin)
      const arr = extractIata(seg.destination)
      if (!dep || !arr || !seg.departure_date || !seg.departure_time) continue
      try {
        await insertVoyageFlight({
          voyage_id:      voyageId,
          flight_num:     seg.flight_no     || '',
          dep_airport:    dep,
          arr_airport:    arr,
          departureDate:  seg.departure_date,
          departureTime:  seg.departure_time,
          arrivalDate:    seg.arrival_date   || seg.departure_date,
          arrivalTime:    seg.arrival_time   || '23:59',
          sort_order:     order++,
          seats_group:    f.seats_group    ?? 0,
          seats_indivi:   f.seats_indivi   ?? 0,
          seats_business: f.seats_business ?? 0,
          fare_base:      f.fare_base      ?? 0,
          fare_fuel:      f.fare_fuel      ?? 0,
          fare_tax:       f.fare_tax       ?? 0,
        })
      } catch { /* 미러링 실패는 무시 */ }
    }
  }
}

export async function createVoyageWithChildren(values: VoyageFormValues): Promise<Voyage> {
  const { flights, itinerary, policies, cabin_grades, ...voyageData } = values

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
      .insert(flights.map((f, i) => ({ ...f, voyage_id: id, sort_order: i + 1 })))
    if (error) throw error
    // voyage_flights 테이블에도 미러링 (항공 탭 연동)
    await mirrorFlightsToVoyageFlights(id, flights)
  }

  if (itinerary.length > 0) {
    const { error } = await sb()
      .from('itinerary_days')
      .insert(itinerary.map((d, i) => ({ ...d, voyage_id: id, sort_order: i + 1 })))
    if (error) throw error
  }

  if (policies.length > 0) {
    const { error } = await sb()
      .from('cancellation_policies')
      .insert(policies.map((p, i) => ({ ...p, voyage_id: id, sort_order: i + 1 })))
    if (error) throw error
  }

  if (cabin_grades.length > 0) {
    await saveCabinGrades(id, cabin_grades.map((g, i) => {
      const price = (Number(g.ccf) || 0) + (Number(g.nccf) || 0) + (Number(g.tax) || 0) + (Number(g.tip) || 0)
      return {
        grade:            g.grade || '기본',
        total:            g.total || 0,
        reserved:         g.reserved || 0,
        price_per_person: price || null,
        ccf:              g.ccf ?? null,
        nccf:             g.nccf ?? null,
        tax:              g.tax ?? null,
        tip:              g.tip ?? null,
        currency:         g.currency || 'USD',
        agent:            g.agent || null,
        sort_order:       i,
      }
    }), [])
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
    .select('*, voyages(region, departure_date, boarding_date)')
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

export async function updateHotel(
  id: string,
  data: Partial<Omit<Hotel, 'id' | 'voyage_id' | 'created_at'>>,
): Promise<Hotel> {
  const { data: row, error } = await sb()
    .from('hotels')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row as Hotel
}

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

export async function restoreHotel(snapshot: Hotel): Promise<void> {
  const { error } = await sb()
    .from('hotels')
    .upsert(snapshot, { onConflict: 'id' })
  if (error) throw error
}

// ── Voyage delete / update ────────────────────────────────────────────────

export async function deleteVoyage(id: string): Promise<void> {
  const { error } = await sb().from('voyages').delete().eq('id', id)
  if (error) throw error
}


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

export async function restoreItineraryDay(snapshot: ItineraryDay): Promise<void> {
  const { error } = await sb()
    .from('itinerary_days')
    .upsert(snapshot, { onConflict: 'id' })
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

export async function restoreCancellationPolicy(snapshot: CancellationPolicy): Promise<void> {
  const { error } = await sb()
    .from('cancellation_policies')
    .upsert(snapshot, { onConflict: 'id' })
  if (error) throw error
}

// ── CabinGrade CRUD ───────────────────────────────────────────────────────

export async function fetchCabinGrades(voyageId: string): Promise<CabinGrade[]> {
  const { data, error } = await sb()
    .from('cabin_grades')
    .select('*')
    .eq('voyage_id', voyageId)
    .order('sort_order')
  if (error) throw error
  return data as CabinGrade[]
}

export async function saveCabinGrades(
  voyageId: string,
  grades: Array<{ id?: string; grade: string; total: number; reserved: number; price_per_person: number | null; ccf?: number | null; nccf?: number | null; tax?: number | null; tip?: number | null; currency: string; agent?: string | null; sort_order: number }>,
  deletedIds: string[],
): Promise<void> {
  if (deletedIds.length > 0) {
    const { error } = await sb().from('cabin_grades').delete().in('id', deletedIds)
    if (error) throw error
  }

  for (const g of grades) {
    if (g.id) {
      const { id, ...patch } = g
      const { error } = await sb().from('cabin_grades').update(patch).eq('id', id)
      if (error) throw error
    } else {
      const { error } = await sb()
        .from('cabin_grades')
        .insert({ ...g, voyage_id: voyageId })
      if (error) throw error
    }
  }

  // voyage 합계 동기화
  const cabinTotal = grades.reduce((s, g) => s + g.total, 0)
  const cabinReserved = grades.reduce((s, g) => s + g.reserved, 0)
  if (grades.length > 0) {
    await updateVoyage(voyageId, {
      cabin_total: cabinTotal,
      cabin_remaining: cabinTotal - cabinReserved,
    })
  }
}

export async function fetchAllCabinGrades(): Promise<CabinGrade[]> {
  const { data, error } = await sb()
    .from('cabin_grades')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as CabinGrade[]
}

// ── Dashboard ─────────────────────────────────────────────────────────────

type OnSaleVoyage = Pick<Voyage, 'id' | 'region' | 'departure_date' | 'return_date' | 'ship_name' | 'cruise_line' | 'airline' | 'tour_leader' | 'cabin_remaining' | 'cabin_total' | 'customer_count' | 'status'>
type DepartureVoyage = Pick<Voyage, 'id' | 'region' | 'departure_date' | 'ship_name' | 'cabin_remaining' | 'cabin_total' | 'status'>
type PaymentRow = PaymentSchedule & { voyages: Pick<Voyage, 'region' | 'departure_date'> }

export interface VoyageDashboardData {
  onSaleVoyages: OnSaleVoyage[]
  thisMonthDepartures: DepartureVoyage[]
  thisMonthPayments: PaymentRow[]
  statusCounts: Record<string, number>
}

export async function fetchVoyageDashboardData(): Promise<VoyageDashboardData> {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const firstDay = `${y}-${m}-01`
  const lastDay = `${y}-${m}-${String(new Date(y, today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`

  const [onSaleRes, departuresRes, paymentsRes, statusRes] = await Promise.all([
    sb().from('voyages')
      .select('id, region, departure_date, return_date, ship_name, cruise_line, airline, tour_leader, cabin_remaining, cabin_total, customer_count, status')
      .eq('status', '판매중')
      .order('departure_date'),
    sb().from('voyages')
      .select('id, region, departure_date, ship_name, cabin_remaining, cabin_total, status')
      .gte('departure_date', firstDay)
      .lte('departure_date', lastDay)
      .neq('status', '취소')
      .order('departure_date'),
    sb().from('payment_schedules')
      .select('*, voyages(region, departure_date)')
      .gte('due_date', firstDay)
      .lte('due_date', lastDay)
      .eq('is_completed', false)
      .order('due_date'),
    sb().from('voyages').select('status').neq('status', '취소'),
  ])

  if (onSaleRes.error) throw onSaleRes.error
  if (departuresRes.error) throw departuresRes.error
  if (paymentsRes.error) throw paymentsRes.error
  if (statusRes.error) throw statusRes.error

  const statusCounts: Record<string, number> = {}
  for (const v of (statusRes.data ?? [])) {
    statusCounts[v.status] = (statusCounts[v.status] ?? 0) + 1
  }

  return {
    onSaleVoyages: (onSaleRes.data ?? []) as OnSaleVoyage[],
    thisMonthDepartures: (departuresRes.data ?? []) as DepartureVoyage[],
    thisMonthPayments: (paymentsRes.data ?? []) as PaymentRow[],
    statusCounts,
  }
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
