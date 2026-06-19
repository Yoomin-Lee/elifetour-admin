import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz'
import { differenceInMinutes } from 'date-fns'

// IATA 공항코드 → IANA 타임존
const AIRPORT_TZ: Record<string, string> = {
  ICN: 'Asia/Seoul',
  GMP: 'Asia/Seoul',
  PUS: 'Asia/Seoul',
  SIN: 'Asia/Singapore',
  DXB: 'Asia/Dubai',
  AUH: 'Asia/Dubai',
  DOH: 'Asia/Qatar',
  LAX: 'America/Los_Angeles',
  SFO: 'America/Los_Angeles',
  SEA: 'America/Los_Angeles',
  ATL: 'America/New_York',
  FLL: 'America/New_York',
  MIA: 'America/New_York',
  JFK: 'America/New_York',
  FCO: 'Europe/Rome',
  VCE: 'Europe/Rome',
  MXP: 'Europe/Rome',
  MUC: 'Europe/Berlin',
  FRA: 'Europe/Berlin',
  BCN: 'Europe/Madrid',
  MAD: 'Europe/Madrid',
  CDG: 'Europe/Paris',
  LHR: 'Europe/London',
  IST: 'Europe/Istanbul',
  SAW: 'Europe/Istanbul',
  HKG: 'Asia/Hong_Kong',
  PVG: 'Asia/Shanghai',
  PEK: 'Asia/Shanghai',
  NRT: 'Asia/Tokyo',
  HND: 'Asia/Tokyo',
  SYD: 'Australia/Sydney',
  MEL: 'Australia/Melbourne',
}

export interface FlightCalculationParams {
  departureAirport: string  // 'ICN'
  arrivalAirport: string    // 'SIN'
  departureDate: string     // 'YYYY-MM-DD' 또는 'YY/MM/DD'
  departureTime: string     // 'HH:MM'
  arrivalDate: string
  arrivalTime: string
}

export interface FlightCalculationResult {
  depDatetime: Date        // UTC Date (DB 저장용)
  arrDatetime: Date        // UTC Date (DB 저장용)
  depIso: string           // "2026-12-15T14:35:00+09:00" (TIMESTAMPTZ insert용)
  arrIso: string
  depTimezone: string      // 'Asia/Seoul'
  arrTimezone: string
  durationMinutes: number
  durationText: string     // "6시간 35분"
}

/** 'YY/MM/DD' 또는 'YYYY-MM-DD' → 'YYYY-MM-DD' */
function normalizeDate(raw: string): string {
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(raw)) {
    const [yy, mm, dd] = raw.split('/')
    return `20${yy}-${mm}-${dd}`
  }
  return raw
}

/** 'HH:MM:SS' 또는 'HH:MM' → 'HH:MM' (PostgreSQL TIME 타입이 초를 포함해 반환함) */
function normalizeTime(raw: string): string {
  return raw.slice(0, 5)
}

export function getAirportTimezone(iataCode: string): string {
  return AIRPORT_TZ[iataCode.toUpperCase()] ?? 'UTC'
}

/**
 * 공항코드 + 날짜 + 시각 → UTC Date 및 ISO 문자열 반환
 * date-fns-tz의 fromZonedTime이 DST 전환을 자동 처리함
 */
export function calcFlightDuration(params: FlightCalculationParams): FlightCalculationResult {
  const { departureAirport, arrivalAirport, departureDate, departureTime, arrivalDate, arrivalTime } = params

  const depTz = getAirportTimezone(departureAirport)
  const arrTz = getAirportTimezone(arrivalAirport)

  const depLocal = `${normalizeDate(departureDate)}T${normalizeTime(departureTime)}:00`
  const arrLocal = `${normalizeDate(arrivalDate)}T${normalizeTime(arrivalTime)}:00`

  // 현지 시각 → UTC (DST 자동 반영)
  const depUtc = fromZonedTime(depLocal, depTz)
  const arrUtc = fromZonedTime(arrLocal, arrTz)

  const durationMinutes = differenceInMinutes(arrUtc, depUtc)
  const hours = Math.floor(durationMinutes / 60)
  const mins = durationMinutes % 60
  const durationText = mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`

  // DB INSERT 용 ISO (오프셋 포함, PostgreSQL TIMESTAMPTZ 호환)
  const depIso = formatInTimeZone(depUtc, depTz, "yyyy-MM-dd'T'HH:mm:ssxxx")
  const arrIso = formatInTimeZone(arrUtc, arrTz, "yyyy-MM-dd'T'HH:mm:ssxxx")

  return {
    depDatetime: depUtc,
    arrDatetime: arrUtc,
    depIso,
    arrIso,
    depTimezone: depTz,
    arrTimezone: arrTz,
    durationMinutes,
    durationText,
  }
}

/** durationMinutes → "X시간 Y분" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
}
