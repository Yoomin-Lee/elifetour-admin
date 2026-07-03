import { supabase } from '../supabase'
import { calcFlightDuration } from '../utils/flightCalc'

function sb() {
  if (!supabase) throw new Error('Supabase 클라이언트 미초기화')
  return supabase
}

export interface VoyageFlight {
  id: string
  voyage_id: string
  pnr: string | null
  flight_num: string
  dep_airport: string
  arr_airport: string
  dep_datetime: string   // ISO string from DB (UTC)
  arr_datetime: string
  flight_duration: string | null
  flight_fare: number | null
  currency_code: string
  sort_order: number
  seats_group: number
  seats_indivi: number
  seats_business: number
  fare_base: number
  fare_fuel: number
  fare_tax: number
  created_at: string
  updated_at: string
}

export interface VoyageFlightInput {
  voyage_id: string
  pnr?: string
  flight_num: string
  dep_airport: string
  arr_airport: string
  departureDate: string   // 'YYYY-MM-DD' — 현지 날짜
  departureTime: string   // 'HH:MM'
  arrivalDate: string
  arrivalTime: string
  flight_fare?: number
  currency_code?: string
  sort_order?: number
  seats_group?: number
  seats_indivi?: number
  seats_business?: number
  fare_base?: number
  fare_fuel?: number
  fare_tax?: number
}

export async function fetchVoyageFlights(voyageId: string): Promise<VoyageFlight[]> {
  const { data, error } = await sb()
    .from('voyage_flights')
    .select('*')
    .eq('voyage_id', voyageId)
    .order('sort_order')

  if (error) throw error
  return data ?? []
}

export async function fetchAllVoyageFlights(): Promise<(VoyageFlight & { voyages: { region: string; departure_date: string; airline: string | null; airline_return: string | null } | null })[]> {
  const { data, error } = await sb()
    .from('voyage_flights')
    .select('*, voyages(region, departure_date, airline, airline_return)')
    .order('sort_order')

  if (error) throw error
  return data ?? []
}

/**
 * 항공편 추가
 * 현지 날짜+시각+공항코드로 dep_datetime/arr_datetime(TIMESTAMPTZ) 자동 계산
 */
export async function insertVoyageFlight(input: VoyageFlightInput): Promise<VoyageFlight> {
  const calc = calcFlightDuration({
    departureAirport: input.dep_airport,
    arrivalAirport: input.arr_airport,
    departureDate: input.departureDate,
    departureTime: input.departureTime,
    arrivalDate: input.arrivalDate,
    arrivalTime: input.arrivalTime,
  })

  const { data, error } = await sb()
    .from('voyage_flights')
    .insert({
      voyage_id: input.voyage_id,
      pnr: input.pnr ?? null,
      flight_num: input.flight_num,
      dep_airport: input.dep_airport.toUpperCase(),
      arr_airport: input.arr_airport.toUpperCase(),
      dep_datetime: calc.depIso,
      arr_datetime: calc.arrIso,
      flight_duration: calc.durationText,
      flight_fare:    input.flight_fare    ?? null,
      currency_code:  input.currency_code  ?? 'KRW',
      sort_order:     input.sort_order     ?? 0,
      seats_group:    input.seats_group    ?? 0,
      seats_indivi:   input.seats_indivi   ?? 0,
      seats_business: input.seats_business ?? 0,
      fare_base:      input.fare_base      ?? 0,
      fare_fuel:      input.fare_fuel      ?? 0,
      fare_tax:       input.fare_tax       ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateVoyageFlight(
  id: string,
  input: Partial<VoyageFlightInput>
): Promise<VoyageFlight> {
  const patch: Record<string, unknown> = {}

  const hasDatetime =
    input.dep_airport && input.arr_airport &&
    input.departureDate && input.departureTime &&
    input.arrivalDate && input.arrivalTime

  if (hasDatetime) {
    const calc = calcFlightDuration({
      departureAirport: input.dep_airport!,
      arrivalAirport: input.arr_airport!,
      departureDate: input.departureDate!,
      departureTime: input.departureTime!,
      arrivalDate: input.arrivalDate!,
      arrivalTime: input.arrivalTime!,
    })
    patch.dep_datetime = calc.depIso
    patch.arr_datetime = calc.arrIso
    patch.flight_duration = calc.durationText
  }

  if (input.dep_airport) patch.dep_airport = input.dep_airport.toUpperCase()
  if (input.arr_airport) patch.arr_airport = input.arr_airport.toUpperCase()
  if (input.flight_num) patch.flight_num = input.flight_num
  if (input.pnr !== undefined) patch.pnr = input.pnr
  if (input.flight_fare !== undefined) patch.flight_fare = input.flight_fare
  if (input.currency_code) patch.currency_code = input.currency_code
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order
  if (input.seats_group !== undefined) patch.seats_group = input.seats_group
  if (input.seats_indivi !== undefined) patch.seats_indivi = input.seats_indivi
  if (input.seats_business !== undefined) patch.seats_business = input.seats_business
  if (input.fare_base !== undefined) patch.fare_base = input.fare_base
  if (input.fare_fuel !== undefined) patch.fare_fuel = input.fare_fuel
  if (input.fare_tax !== undefined) patch.fare_tax = input.fare_tax

  const { data, error } = await sb()
    .from('voyage_flights')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteVoyageFlight(id: string): Promise<void> {
  const { error } = await sb().from('voyage_flights').delete().eq('id', id)
  if (error) throw error
}

export async function deleteVoyageFlightsByVoyage(voyageId: string): Promise<void> {
  const { error } = await sb().from('voyage_flights').delete().eq('voyage_id', voyageId)
  if (error) throw error
}

export async function restoreVoyageFlight(snapshot: VoyageFlight): Promise<void> {
  const { error } = await sb()
    .from('voyage_flights')
    .upsert(snapshot, { onConflict: 'id' })
  if (error) throw error
}
