import * as XLSX from 'xlsx'
import {
  fetchVoyages,
  fetchAllFlights,
  fetchAllItinerary,
  fetchAllCancellationPolicies,
  fetchAllHistoryLogs,
  fetchAllFeedbackLogs,
  fetchAllHotels,
  fetchAllCabinGrades,
} from '@/lib/queries/voyages'
import { fetchAllVoyageFlights } from '@/lib/queries/voyageFlights'
import { fetchAllPaymentSchedules } from '@/lib/queries/paymentSchedules'
import { voyageTitle } from '@/types/database'

// ── 날짜 변환 ─────────────────────────────────────────────────────────────
// Date 객체, 엑셀 시리얼, "27/09/10(금)", "2027-09-10", "2027.09.10" 등 처리
function toDateStr(val: unknown): string {
  if (!val) return ''

  if (val instanceof Date) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const s = String(val).trim().replace(/\([가-힣a-zA-Z]+\)/, '').trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // YY/MM/DD → 20YY-MM-DD
  const a = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
  if (a) return `20${a[1]}-${a[2]}-${a[3]}`

  // YYYY/MM/DD 또는 YYYY.MM.DD
  const b = s.match(/^(\d{4})[./](\d{2})[./](\d{2})$/)
  if (b) return `${b[1]}-${b[2]}-${b[3]}`

  // MM/DD (월/일만 있을 때) → 그대로 반환 (사용자가 연도 수동 확인)
  return s
}

// ── 시간 변환 ─────────────────────────────────────────────────────────────
// 엑셀 소수 시간, "13:30", "13:30:00" 등 처리
function toTimeStr(val: unknown): string {
  if (!val && val !== 0) return ''

  // 엑셀 소수 시간 (예: 0.5625 = 13:30)
  if (typeof val === 'number') {
    const totalMin = Math.round(val * 24 * 60)
    const h = Math.floor(totalMin / 60) % 24
    const m = totalMin % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const s = String(val).trim()
  const match = s.match(/^(\d{1,2}):(\d{2})/)
  if (match) return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
  return s
}

// ── 컬럼 찾기 (부분 일치, 대소문자 무시) ─────────────────────────────────
function col(row: Record<string, unknown>, aliases: string[]): unknown {
  const key = Object.keys(row).find(k =>
    aliases.some(a => k.trim().toLowerCase().includes(a.toLowerCase()))
  )
  return key ? row[key] : undefined
}

function str(val: unknown): string {
  return String(val ?? '').trim()
}

// ── 항공편 파싱 ───────────────────────────────────────────────────────────
export interface FlightRow {
  flight_no?: string
  origin?: string
  destination?: string
  departure_date?: string
  arrival_date?: string
  departure_time?: string
  arrival_time?: string
  duration?: string
  sort_order: number
}

export async function parseFlightsExcel(file: File): Promise<FlightRow[]> {
  const buf = await file.arrayBuffer()
  const wb  = XLSX.read(buf, { type: 'array', cellDates: true })
  const ws  = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  const result: FlightRow[] = rows
    .map((row, i) => ({
      flight_no:      str(col(row, ['편명', '항공편명', '항공편', 'flight_no', 'flight'])),
      origin:         str(col(row, ['출발지', '출발공항', '출발', 'origin', 'from'])),
      destination:    str(col(row, ['도착지', '도착공항', '도착', 'destination', 'to'])),
      departure_date: toDateStr(col(row, ['출발일', '출발날짜', 'departure_date', 'departure date', 'dep date'])),
      arrival_date:   toDateStr(col(row, ['도착일', '도착날짜', 'arrival_date', 'arrival date', 'arr date'])),
      departure_time: toTimeStr(col(row, ['출발시간', '출발 시간', 'departure_time', 'dep time'])),
      arrival_time:   toTimeStr(col(row, ['도착시간', '도착 시간', 'arrival_time', 'arr time'])),
      duration:       str(col(row, ['소요시간', '소요 시간', '비행시간', 'duration'])),
      sort_order:     i + 1,
    }))
    .filter(r => r.flight_no || r.origin || r.destination)

  return result
}

// ── 기항지 파싱 ───────────────────────────────────────────────────────────
export interface ItineraryRow {
  date: string
  port: string
  arrival_time?: string
  departure_time?: string
  summary?: string
  sort_order: number
}

export async function parseItineraryExcel(file: File): Promise<ItineraryRow[]> {
  const buf = await file.arrayBuffer()
  const wb  = XLSX.read(buf, { type: 'array', cellDates: true })
  const ws  = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  return rows
    .map((row, i) => ({
      date:           toDateStr(col(row, ['날짜', 'date', '일자'])),
      port:           str(col(row, ['기항지', '항구', '도시', '포트', 'port', 'city'])),
      arrival_time:   toTimeStr(col(row, ['도착', '도착시간', '도착 시간', 'arrival', 'arrival_time', 'arr'])),
      departure_time: toTimeStr(col(row, ['출발', '출발시간', '출발 시간', 'departure', 'departure_time', 'dep'])),
      summary:        str(col(row, ['비고', '요약', '일정', '설명', 'summary', 'note', 'remark'])),
      sort_order:     i + 1,
    }))
    .filter(r => r.port)
}

// ── 양식 다운로드 ─────────────────────────────────────────────────────────
export function downloadFlightsTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['편명', '출발지', '도착지', '출발일', '도착일', '출발시간', '도착시간', '소요시간'],
    ['KE907', '인천(ICN)', '바르셀로나(BCN)', '2027-09-10', '2027-09-10', '13:30', '19:10', '12h 40m'],
    ['KE908', '바르셀로나(BCN)', '인천(ICN)', '2027-09-19', '2027-09-20', '21:20', '17:05', '12h 45m'],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '항공편')
  XLSX.writeFile(wb, '항공편_입력양식.xlsx')
}

export function downloadItineraryTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['날짜', '기항지', '도착', '출발', '비고'],
    ['2027-09-10', '바르셀로나 (스페인)', '', '17:00', '인천 출발 → 바르셀로나 승선'],
    ['2027-09-11', '해상', '', '', '크루즈 이동'],
    ['2027-09-12', '마르세유 (프랑스)', '08:00', '17:00', '노트르담 드 라 가르드 대성당'],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '기항지')
  XLSX.writeFile(wb, '기항지_입력양식.xlsx')
}

// ── 전체 데이터 백업 내보내기 ───────────────────────────────────────────────
function title(v: { region: string; departure_date: string } | null | undefined): string {
  return v ? voyageTitle(v) : ''
}

function addSheet(wb: XLSX.WorkBook, name: string, rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}])
  XLSX.utils.book_append_sheet(wb, ws, name)
}

/** 항차 마스터 + 연결된 상세데이터 전체를 시트별로 나눠 하나의 엑셀 파일로 내보낸다 */
export async function exportAllVoyageData(): Promise<void> {
  const [
    voyages, flights, voyageFlights, itinerary, cancellations,
    history, feedback, hotels, cabinGrades, payments,
  ] = await Promise.all([
    fetchVoyages(),
    fetchAllFlights(),
    fetchAllVoyageFlights(),
    fetchAllItinerary(),
    fetchAllCancellationPolicies(),
    fetchAllHistoryLogs(),
    fetchAllFeedbackLogs(),
    fetchAllHotels(),
    fetchAllCabinGrades(),
    fetchAllPaymentSchedules(),
  ])

  const voyageTitleMap = new Map<string, string>()
  voyages.forEach(v => voyageTitleMap.set(v.id, voyageTitle(v)))

  const wb = XLSX.utils.book_new()

  addSheet(wb, '항차', voyages.map(v => ({
    ID: v.id,
    행사명: v.region,
    상태: v.status,
    출발일: v.departure_date,
    귀국일: v.return_date,
    승선일: v.boarding_date,
    기간: v.duration,
    선사: v.cruise_line,
    크루즈: v.ship_name,
    항공사_출발: v.airline,
    항공사_귀국: v.airline_return,
    고객수: v.customer_count,
    인솔자: v.tour_leader,
    상품가: v.product_price,
    캐빈보유: v.cabin_total,
    캐빈잔여: v.cabin_remaining,
    비고: v.hotel,
    생성일: v.created_at,
    수정일: v.updated_at,
  })))

  addSheet(wb, '항공(마스터)', flights.map(f => ({
    ID: f.id,
    행사명: title(f.voyages),
    이름: f.label,
    편명: f.flight_no,
    출발지: f.origin,
    도착지: f.destination,
    출발일: f.departure_date,
    도착일: f.arrival_date,
    출발시간: f.departure_time,
    도착시간: f.arrival_time,
    소요시간: f.duration,
    항공료: f.fare,
    그룹좌석: f.seats_group,
    인디비좌석: f.seats_indivi,
    비즈니스좌석: f.seats_business,
    운임_그룹: f.fare_base,
    유류할증_그룹: f.fare_fuel,
    발권피_그룹: f.fare_tax,
    운임_인디비: f.fare_base_indivi,
    유류할증_인디비: f.fare_fuel_indivi,
    발권피_인디비: f.fare_tax_indivi,
    운임_비즈니스: f.fare_base_business,
    유류할증_비즈니스: f.fare_fuel_business,
    발권피_비즈니스: f.fare_tax_business,
    구간정보_JSON: JSON.stringify(f.segments ?? []),
    생성일: f.created_at,
  })))

  addSheet(wb, '항공좌석(보유현황)', voyageFlights.map(vf => ({
    ID: vf.id,
    행사명: title(vf.voyages),
    편명: vf.flight_num,
    PNR: vf.pnr,
    출발공항: vf.dep_airport,
    도착공항: vf.arr_airport,
    출발일시_UTC: vf.dep_datetime,
    도착일시_UTC: vf.arr_datetime,
    소요시간: vf.flight_duration,
    항공료: vf.flight_fare,
    통화: vf.currency_code,
    그룹좌석: vf.seats_group,
    인디비좌석: vf.seats_indivi,
    비즈니스좌석: vf.seats_business,
    운임: vf.fare_base,
    유류할증: vf.fare_fuel,
    발권피: vf.fare_tax,
    생성일: vf.created_at,
  })))

  addSheet(wb, '기항지', itinerary.map(d => ({
    ID: d.id,
    행사명: title(d.voyages),
    날짜: d.date,
    기항지: d.port,
    입항: d.arrival_time,
    출항: d.departure_time,
    구분: d.category,
    비용: d.cost,
    비용통화: d.cost_currency,
    비고: d.summary,
  })))

  addSheet(wb, '취소료', cancellations.map(c => ({
    ID: c.id,
    행사명: title(c.voyages),
    구분: c.category,
    기준일_시작: c.start_d_minus,
    기준일_종료: c.end_d_minus,
    시작일: c.start_date,
    종료일: c.end_date,
    기준일자: c.reference_date,
    취소료_설명: c.fee_description,
    취소료_유형: c.fee_type,
    취소료_값: c.fee_value,
    취소료_단위: c.fee_unit,
    비고: c.note,
  })))

  addSheet(wb, '히스토리', history.map(h => ({
    ID: h.id,
    행사명: title(h.voyages),
    일시: h.logged_at,
    작성자: h.author,
    내용: h.content,
  })))

  addSheet(wb, '피드백', feedback.map(f => ({
    ID: f.id,
    행사명: title(f.voyages),
    일시: f.logged_at,
    작성자: f.author,
    태그: f.tag,
    내용: f.content,
  })))

  addSheet(wb, '호텔', hotels.map(h => ({
    ID: h.id,
    행사명: title(h.voyages),
    투숙일: h.stay_date,
    호텔명: h.hotel_name,
    객실요금: h.room_rate,
    통화: h.currency,
    메모: h.memo,
    생성일: h.created_at,
  })))

  addSheet(wb, '캐빈등급(보유현황)', cabinGrades.map(g => ({
    ID: g.id,
    행사명: voyageTitleMap.get(g.voyage_id) ?? '',
    등급: g.grade,
    인실: g.occupancy,
    보유: g.total,
    예약: g.reserved,
    인당가격: g.price_per_person,
    CCF: g.ccf,
    NCCF: g.nccf,
    TAX: g.tax,
    TIP: g.tip,
    통화: g.currency,
    에이전트: g.agent,
    생성일: g.created_at,
  })))

  addSheet(wb, '결제스케줄', payments.map(p => ({
    ID: p.id,
    행사명: title(p.voyages),
    구분: p.category,
    결제유형: p.payment_type,
    섹션: p.section,
    에이전트ID: p.agent_id,
    금액: p.amount,
    통화: p.currency,
    마감일: p.due_date,
    완료여부: p.is_completed ? '완료' : '미완료',
    메모: p.memo,
    생성일: p.created_at,
    수정일: p.updated_at,
  })))

  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `이라이프투어_전체데이터_${today}.xlsx`)
}
