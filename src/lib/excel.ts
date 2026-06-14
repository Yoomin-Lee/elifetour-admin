import * as XLSX from 'xlsx'

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
