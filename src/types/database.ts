export type VoyageStatus = '미오픈' | '판매중' | '마감' | '출발완료' | '취소'
export type FeeType = 'percent' | 'fixed' | 'free'

export interface Voyage {
  id: string
  region: string
  status: VoyageStatus
  airline: string | null
  cruise_line: string | null
  ship_name: string | null
  departure_date: string
  return_date: string | null
  cabin_total: number
  cabin_remaining: number
  customer_count: number
  tour_leader: string | null
  hotel: string | null
  created_at: string
  updated_at: string
}

export interface Flight {
  id: string
  voyage_id: string
  flight_no: string | null
  origin: string | null
  destination: string | null
  departure_date: string | null
  arrival_date: string | null
  departure_time: string | null
  arrival_time: string | null
  duration: string | null
  fare: number | null
  sort_order: number
  created_at: string
}

export interface ItineraryDay {
  id: string
  voyage_id: string
  date: string
  port: string
  arrival_time: string | null
  departure_time: string | null
  category: string | null
  cost: number | null
  summary: string | null
  sort_order: number
}

export interface CancellationPolicy {
  id: string
  voyage_id: string
  category: string | null
  start_d_minus: number | null
  end_d_minus: number | null
  start_date: string | null
  end_date: string | null
  fee_description: string | null
  fee_type: FeeType | null
  fee_value: number | null
  fee_unit: string | null
  note: string | null
  sort_order: number
}

export interface HistoryLog {
  id: string
  voyage_id: string
  logged_at: string
  author: string | null
  content: string
}

export interface AuditLog {
  id: string
  table_name: string
  record_id: string | null
  operation: string
  changed_by: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  logged_at: string
}

/** 항차 표시명: "27/09/10 서부지중해" */
export function voyageTitle(v: Pick<Voyage, 'departure_date' | 'region'>): string {
  const d = v.departure_date
  const yy = d.slice(2, 4)
  const mm = d.slice(5, 7)
  const dd = d.slice(8, 10)
  return `${yy}/${mm}/${dd} ${v.region}`
}
