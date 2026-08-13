import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
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
// 관리·백업용 데이터 시트 스타일: 헤더 강조, 지브라 줄무늬, 얇은 테두리,
// 열너비 자동조정, 첫 행 고정, 자동 필터, 타입별 정렬·서식.
// (community xlsx 패키지는 셀 스타일 작성을 지원하지 않아 이 부분만 exceljs 사용)

function title(v: { region: string; departure_date: string } | null | undefined): string {
  return v ? voyageTitle(v) : ''
}

function colLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

// 'YYYY-MM-DD...' 문자열을 로컬 날짜(시각 없음)로 파싱 — UTC 파싱 시 생기는 하루 밀림 방지
function parseDateOnly(v: unknown): Date | null {
  if (typeof v !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

// 타임존 포함 ISO 타임스탬프 문자열을 그대로 파싱 (값 자체는 원본과 동일한 시점)
function parseDateTime(v: unknown): Date | null {
  if (typeof v !== 'string' || !v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

type ColType = 'text' | 'number' | 'krw' | 'date' | 'datetime'
interface ColSpec { header: string; key: string; type: ColType; width: number }

// 컬럼 특성별 권장 너비(문자 단위) — AutoFit 대신 고정 사용.
// 텍스트는 역할별 상한(짧은 코드/중간 라벨/고유명사/자유서술), 날짜·일시는 각각
// 타입 내에서 통일, 숫자는 좁게, 원화 금액은 ₩ 기호를 감안해 살짝 더 넓게.
const W = {
  short: 8,     // 3~4자 코드(공항코드, 통화, 인실 등)
  code: 10,     // 상태·구분·태그 등 짧은 분류값
  label: 14,    // 인솔자·작성자·에이전트 등 중간 길이 텍스트
  title: 22,    // 행사명·크루즈·호텔명 등 고유명사
  long: 30,     // 내용·메모·비고 등 자유서술형 — 과도한 확장 방지용 상한
  date: 12,     // date 타입 전부 공통
  datetime: 17, // datetime 타입 전부 공통
  num: 9,       // 순수 숫자(좌석수·인실·보유/예약 등)
  krw: 12,      // 원화 금액(₩ 기호 포함 고려)
} as const

const FONT_NAME = '맑은 고딕'
const NUMBER_FMT = '#,##0'
const KRW_FMT = '"₩"#,##0'
const DATE_FMT = 'yyyy-mm-dd'
const DATETIME_FMT = 'yyyy-mm-dd hh:mm'

const HEADER_FILL = 'FF0F2849'   // 브랜드 네이비
const HEADER_FONT = 'FFFFFFFF'
const BORDER_COLOR = 'FFE2E8F0' // slate-200
const BAND_FILL = 'FFF8FAFC'    // slate-50

// 항차 시트 '상태' 컬럼 전용 — 앱 UI(STATUS_COLORS)와 동일한 팔레트
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  '미오픈':   { bg: 'FFF1F5F9', fg: 'FF475569' },
  '판매중':   { bg: 'FFDBEAFE', fg: 'FF1D4ED8' },
  '마감':     { bg: 'FFFEF3C7', fg: 'FFB45309' },
  '출발완료': { bg: 'FFD1FAE5', fg: 'FF15803D' },
  '취소':     { bg: 'FFFEE2E2', fg: 'FFDC2626' },
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top:    { style: 'thin', color: { argb: BORDER_COLOR } },
  left:   { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
  right:  { style: 'thin', color: { argb: BORDER_COLOR } },
}

const DATA_ROW_HEIGHT = 20
const LINE_HEIGHT = 14
const MAX_WRAP_LINES = 6          // 이보다 길면 셀 안에서 스크롤 없이도 열어서 확인 가능하니 높이만 제한
const CHARS_PER_LINE = 18         // 한글 비중을 감안한 보수적인 줄당 글자 수(넉넉하게 잡아 덜 잘리게)

// long 티어(자유서술형) 컬럼의 줄바꿈 후 예상 줄 수 — 개행 문자 + 폭 초과분을 함께 계산
function estimateWrappedLines(value: unknown): number {
  const s = value == null ? '' : String(value)
  if (!s) return 1
  let total = 0
  for (const line of s.split('\n')) total += Math.max(1, Math.ceil(line.length / CHARS_PER_LINE))
  return Math.min(MAX_WRAP_LINES, Math.max(1, total))
}

function addStyledSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: ColSpec[],
  rows: Record<string, unknown>[],
  statusColumnKey?: string,
) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })

  ws.columns = columns.map(c => ({ header: c.header, key: c.key, width: c.width }))
  if (rows.length > 0) ws.addRows(rows)

  const headerRow = ws.getRow(1)
  headerRow.height = 24
  headerRow.eachCell(cell => {
    cell.font = { name: FONT_NAME, bold: true, color: { argb: HEADER_FONT } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = THIN_BORDER
  })

  for (let i = 0; i < rows.length; i++) {
    const row = ws.getRow(i + 2)
    const isBanded = i % 2 === 1
    let maxLines = 1
    columns.forEach((c, colIdx) => {
      const cell = row.getCell(colIdx + 1)
      const isWrapCol = c.type === 'text' && c.width === W.long
      cell.border = THIN_BORDER
      cell.font = { name: FONT_NAME }
      cell.alignment = {
        vertical: 'middle',
        horizontal: c.type === 'text' ? 'left' : c.type === 'date' || c.type === 'datetime' ? 'center' : 'right',
        indent: c.type === 'text' ? 1 : 0,
        wrapText: isWrapCol,
      }
      if (c.type === 'number') cell.numFmt = NUMBER_FMT
      else if (c.type === 'krw') cell.numFmt = KRW_FMT
      else if (c.type === 'date') cell.numFmt = DATE_FMT
      else if (c.type === 'datetime') cell.numFmt = DATETIME_FMT
      if (isBanded) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BAND_FILL } }

      if (isWrapCol) maxLines = Math.max(maxLines, estimateWrappedLines(cell.value))

      if (statusColumnKey && c.key === statusColumnKey) {
        const colors = STATUS_COLORS[String(row.getCell(colIdx + 1).value ?? '')]
        if (colors) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } }
          cell.font = { name: FONT_NAME, bold: true, color: { argb: colors.fg } }
        }
      }
    })
    row.height = maxLines > 1 ? maxLines * LINE_HEIGHT + 6 : DATA_ROW_HEIGHT
  }

  if (columns.length > 0) ws.autoFilter = `A1:${colLetter(columns.length)}1`
}

function downloadWorkbook(wb: ExcelJS.Workbook, filename: string): Promise<void> {
  return wb.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  })
}

export interface ExportResult {
  filename: string
  voyageCount: number
}

export const SHEET_DEFS = [
  { key: 'voyages',       label: '항차' },
  { key: 'flights',       label: '항공(마스터)' },
  { key: 'voyageFlights', label: '항공좌석(보유현황)' },
  { key: 'itinerary',     label: '기항지' },
  { key: 'cancellations', label: '취소료' },
  { key: 'history',       label: '히스토리' },
  { key: 'feedback',      label: '피드백' },
  { key: 'hotels',        label: '호텔' },
  { key: 'cabinGrades',   label: '캐빈등급(보유현황)' },
  { key: 'payments',      label: '결제스케줄' },
] as const

export type SheetKey = typeof SHEET_DEFS[number]['key']

const ALL_SHEET_KEYS: SheetKey[] = SHEET_DEFS.map(s => s.key)

/**
 * 항차 마스터 + 연결된 상세데이터 전체를 시트별로 나눠 하나의 엑셀 파일로 내보낸다.
 * years를 지정하면(예: ['2026', '2027']) 해당 연도들에 출발하는 항차만 걸러서 내보낸다.
 * sheetKeys를 지정하면 그 시트만 포함한다(생략 시 전체 시트).
 */
export async function exportAllVoyageData(years?: string[], sheetKeys?: SheetKey[]): Promise<ExportResult> {
  const includeSheets = new Set(sheetKeys && sheetKeys.length > 0 ? sheetKeys : ALL_SHEET_KEYS)
  const [
    allVoyages, allFlights, allVoyageFlights, allItinerary, allCancellations,
    allHistory, allFeedback, allHotels, allCabinGrades, allPayments,
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

  const filterYears = years && years.length > 0 ? years : null
  const voyageIds = filterYears
    ? new Set(allVoyages.filter(v => filterYears.some(y => v.departure_date?.startsWith(y))).map(v => v.id))
    : null

  function byYear<T extends { voyage_id: string }>(rows: T[]): T[] {
    return voyageIds ? rows.filter(r => voyageIds.has(r.voyage_id)) : rows
  }

  const voyages       = filterYears ? allVoyages.filter(v => filterYears.some(y => v.departure_date?.startsWith(y))) : allVoyages
  const flights       = byYear(allFlights)
  const voyageFlights = byYear(allVoyageFlights)
  const itinerary     = byYear(allItinerary)
  const cancellations = byYear(allCancellations)
  const history       = byYear(allHistory)
  const feedback      = byYear(allFeedback)
  const hotels        = byYear(allHotels)
  const cabinGrades   = byYear(allCabinGrades)
  const payments      = byYear(allPayments)

  const voyageTitleMap = new Map<string, string>()
  allVoyages.forEach(v => voyageTitleMap.set(v.id, voyageTitle(v)))

  const wb = new ExcelJS.Workbook()

  if (includeSheets.has('voyages')) addStyledSheet(wb, '항차', [
    { header: '행사명',     key: 'region',         type: 'text',   width: W.title },
    { header: '상태',       key: 'status',         type: 'text',   width: W.code  },
    { header: '출발일',     key: 'departure_date', type: 'date',   width: W.date  },
    { header: '귀국일',     key: 'return_date',    type: 'date',   width: W.date  },
    { header: '승선일',     key: 'boarding_date',  type: 'date',   width: W.date  },
    { header: '기간',       key: 'duration',       type: 'text',   width: W.code  },
    { header: '선사',       key: 'cruise_line',    type: 'text',   width: W.label },
    { header: '크루즈',     key: 'ship_name',      type: 'text',   width: W.title },
    { header: '항공사',     key: 'airline',        type: 'text',   width: W.label },
    { header: '고객수',     key: 'customer_count', type: 'number', width: W.num   },
    { header: '인솔자',     key: 'tour_leader',    type: 'text',   width: W.label },
    { header: '상품가',     key: 'product_price',  type: 'krw',    width: W.krw   },
    { header: '캐빈보유',   key: 'cabin_total',     type: 'number', width: W.num   },
    { header: '캐빈잔여',   key: 'cabin_remaining', type: 'number', width: W.num   },
    { header: '비고',       key: 'note',           type: 'text',   width: W.long  },
  ], voyages.map(v => ({
    region: v.region,
    status: v.status,
    departure_date: parseDateOnly(v.departure_date),
    return_date: parseDateOnly(v.return_date),
    boarding_date: parseDateOnly(v.boarding_date),
    duration: v.duration,
    cruise_line: v.cruise_line,
    ship_name: v.ship_name,
    airline: v.airline && v.airline_return ? `${v.airline}/${v.airline_return}` : (v.airline ?? v.airline_return),
    customer_count: v.customer_count,
    tour_leader: v.tour_leader,
    product_price: v.product_price,
    cabin_total: v.cabin_total,
    cabin_remaining: v.cabin_remaining,
    note: v.hotel,
  })), 'status')

  if (includeSheets.has('flights')) addStyledSheet(wb, '항공(마스터)', [
    { header: '행사명',       key: 'voyage_title',        type: 'text',   width: W.title    },
    { header: '이름',         key: 'label',               type: 'text',   width: W.label    },
    { header: '편명',         key: 'flight_no',           type: 'text',   width: W.code     },
    { header: '출발지',       key: 'origin',              type: 'text',   width: W.label    },
    { header: '도착지',       key: 'destination',         type: 'text',   width: W.label    },
    { header: '출발일',       key: 'departure_date',      type: 'date',   width: W.date     },
    { header: '도착일',       key: 'arrival_date',        type: 'date',   width: W.date     },
    { header: '출발시간',     key: 'departure_time',      type: 'text',   width: W.code     },
    { header: '도착시간',     key: 'arrival_time',        type: 'text',   width: W.code     },
    { header: '소요시간',     key: 'duration',            type: 'text',   width: W.label    },
    { header: '항공료',       key: 'fare',                type: 'number', width: W.krw      },
    { header: '그룹좌석',     key: 'seats_group',         type: 'number', width: W.num      },
    { header: '인디비좌석',   key: 'seats_indivi',        type: 'number', width: W.num      },
    { header: '비즈니스좌석', key: 'seats_business',      type: 'number', width: W.num      },
    { header: '운임_그룹',    key: 'fare_base',           type: 'krw',    width: W.krw      },
    { header: '유류세_그룹',  key: 'fare_fuel',           type: 'krw',    width: W.krw      },
    { header: '발권피_그룹',  key: 'fare_tax',            type: 'krw',    width: W.krw      },
    { header: '운임_인디비',  key: 'fare_base_indivi',    type: 'krw',    width: W.krw      },
    { header: '유류세_인디비', key: 'fare_fuel_indivi',  type: 'krw',    width: W.krw      },
    { header: '발권피_인디비', key: 'fare_tax_indivi',     type: 'krw',    width: W.krw      },
    { header: '운임_비즈니스', key: 'fare_base_business',  type: 'krw',    width: W.krw      },
    { header: '유류세_비즈니스', key: 'fare_fuel_business', type: 'krw',  width: W.krw      },
    { header: '발권피_비즈니스', key: 'fare_tax_business',  type: 'krw',    width: W.krw      },
    { header: '구간정보_JSON', key: 'segments_json',      type: 'text',   width: W.long     },
  ], flights.map(f => ({
    voyage_title: title(f.voyages),
    label: f.label,
    flight_no: f.flight_no,
    origin: f.origin,
    destination: f.destination,
    departure_date: parseDateOnly(f.departure_date),
    arrival_date: parseDateOnly(f.arrival_date),
    departure_time: f.departure_time,
    arrival_time: f.arrival_time,
    duration: f.duration,
    fare: f.fare,
    seats_group: f.seats_group,
    seats_indivi: f.seats_indivi,
    seats_business: f.seats_business,
    fare_base: f.fare_base,
    fare_fuel: f.fare_fuel,
    fare_tax: f.fare_tax,
    fare_base_indivi: f.fare_base_indivi,
    fare_fuel_indivi: f.fare_fuel_indivi,
    fare_tax_indivi: f.fare_tax_indivi,
    fare_base_business: f.fare_base_business,
    fare_fuel_business: f.fare_fuel_business,
    fare_tax_business: f.fare_tax_business,
    segments_json: JSON.stringify(f.segments ?? []),
  })))

  if (includeSheets.has('voyageFlights')) addStyledSheet(wb, '항공좌석(보유현황)', [
    { header: '행사명',       key: 'voyage_title',    type: 'text',     width: W.title    },
    { header: '편명',         key: 'flight_num',      type: 'text',     width: W.code     },
    { header: 'PNR',          key: 'pnr',             type: 'text',     width: W.code     },
    { header: '출발공항',     key: 'dep_airport',     type: 'text',     width: W.short    },
    { header: '도착공항',     key: 'arr_airport',     type: 'text',     width: W.short    },
    { header: '출발일시_UTC', key: 'dep_datetime',    type: 'datetime', width: W.datetime },
    { header: '도착일시_UTC', key: 'arr_datetime',    type: 'datetime', width: W.datetime },
    { header: '소요시간',     key: 'flight_duration', type: 'text',     width: W.label    },
    { header: '항공료',       key: 'flight_fare',     type: 'number',   width: W.krw      },
    { header: '통화',         key: 'currency_code',   type: 'text',     width: W.short    },
    { header: '그룹좌석',     key: 'seats_group',     type: 'number',   width: W.num      },
    { header: '인디비좌석',   key: 'seats_indivi',    type: 'number',   width: W.num      },
    { header: '비즈니스좌석', key: 'seats_business',  type: 'number',   width: W.num      },
    { header: '운임',         key: 'fare_base',       type: 'krw',      width: W.krw      },
    { header: '유류세',       key: 'fare_fuel',       type: 'krw',      width: W.krw      },
    { header: '발권피',       key: 'fare_tax',        type: 'krw',      width: W.krw      },
  ], voyageFlights.map(vf => ({
    voyage_title: title(vf.voyages),
    flight_num: vf.flight_num,
    pnr: vf.pnr,
    dep_airport: vf.dep_airport,
    arr_airport: vf.arr_airport,
    dep_datetime: parseDateTime(vf.dep_datetime),
    arr_datetime: parseDateTime(vf.arr_datetime),
    flight_duration: vf.flight_duration,
    flight_fare: vf.flight_fare,
    currency_code: vf.currency_code,
    seats_group: vf.seats_group,
    seats_indivi: vf.seats_indivi,
    seats_business: vf.seats_business,
    fare_base: vf.fare_base,
    fare_fuel: vf.fare_fuel,
    fare_tax: vf.fare_tax,
  })))

  if (includeSheets.has('itinerary')) addStyledSheet(wb, '기항지', [
    { header: '행사명',   key: 'voyage_title',    type: 'text',   width: W.title },
    { header: '날짜',     key: 'date',            type: 'date',   width: W.date  },
    { header: '기항지',   key: 'port',            type: 'text',   width: W.title },
    { header: '입항',     key: 'arrival_time',    type: 'text',   width: W.code  },
    { header: '출항',     key: 'departure_time',  type: 'text',   width: W.code  },
    { header: '구분',     key: 'category',        type: 'text',   width: W.code  },
    { header: '비용',     key: 'cost',            type: 'number', width: W.krw   },
    { header: '비용통화', key: 'cost_currency',   type: 'text',   width: W.short },
    { header: '비고',     key: 'summary',         type: 'text',   width: W.long  },
  ], itinerary.map(d => ({
    voyage_title: title(d.voyages),
    date: parseDateOnly(d.date),
    port: d.port,
    arrival_time: d.arrival_time,
    departure_time: d.departure_time,
    category: d.category,
    cost: d.cost,
    cost_currency: d.cost_currency,
    summary: d.summary,
  })))

  if (includeSheets.has('cancellations')) addStyledSheet(wb, '취소료', [
    { header: '행사명',       key: 'voyage_title',      type: 'text',   width: W.title },
    { header: '구분',         key: 'category',          type: 'text',   width: W.code  },
    { header: '기준일_시작', key: 'start_d_minus',      type: 'number', width: W.num   },
    { header: '기준일_종료', key: 'end_d_minus',        type: 'number', width: W.num   },
    { header: '시작일',       key: 'start_date',        type: 'date',   width: W.date  },
    { header: '종료일',       key: 'end_date',          type: 'date',   width: W.date  },
    { header: '기준일자',     key: 'reference_date',    type: 'date',   width: W.date  },
    { header: '취소료_설명', key: 'fee_description',    type: 'text',   width: W.label },
    { header: '취소료_유형', key: 'fee_type',           type: 'text',   width: W.code  },
    { header: '취소료_값',   key: 'fee_value',          type: 'number', width: W.num   },
    { header: '취소료_단위', key: 'fee_unit',           type: 'text',   width: W.short },
    { header: '비고',         key: 'note',              type: 'text',   width: W.long  },
  ], cancellations.map(c => ({
    voyage_title: title(c.voyages),
    category: c.category,
    start_d_minus: c.start_d_minus,
    end_d_minus: c.end_d_minus,
    start_date: parseDateOnly(c.start_date),
    end_date: parseDateOnly(c.end_date),
    reference_date: parseDateOnly(c.reference_date),
    fee_description: c.fee_description,
    fee_type: c.fee_type,
    fee_value: c.fee_value,
    fee_unit: c.fee_unit,
    note: c.note,
  })))

  if (includeSheets.has('history')) addStyledSheet(wb, '히스토리', [
    { header: '행사명', key: 'voyage_title', type: 'text',     width: W.title    },
    { header: '일시',   key: 'logged_at',    type: 'datetime', width: W.datetime },
    { header: '작성자', key: 'author',       type: 'text',     width: W.label    },
    { header: '내용',   key: 'content',      type: 'text',     width: W.long     },
  ], history.map(h => ({
    voyage_title: title(h.voyages),
    logged_at: parseDateTime(h.logged_at),
    author: h.author,
    content: h.content,
  })))

  if (includeSheets.has('feedback')) addStyledSheet(wb, '피드백', [
    { header: '행사명', key: 'voyage_title', type: 'text',     width: W.title    },
    { header: '일시',   key: 'logged_at',    type: 'datetime', width: W.datetime },
    { header: '작성자', key: 'author',       type: 'text',     width: W.label    },
    { header: '태그',   key: 'tag',          type: 'text',     width: W.short    },
    { header: '내용',   key: 'content',      type: 'text',     width: W.long     },
  ], feedback.map(f => ({
    voyage_title: title(f.voyages),
    logged_at: parseDateTime(f.logged_at),
    author: f.author,
    tag: f.tag,
    content: f.content,
  })))

  if (includeSheets.has('hotels')) addStyledSheet(wb, '호텔', [
    { header: '행사명',   key: 'voyage_title', type: 'text',   width: W.title },
    { header: '투숙일',   key: 'stay_date',    type: 'date',   width: W.date  },
    { header: '호텔명',   key: 'hotel_name',   type: 'text',   width: W.title },
    { header: '객실요금', key: 'room_rate',    type: 'number', width: W.krw   },
    { header: '통화',     key: 'currency',     type: 'text',   width: W.short },
    { header: '메모',     key: 'memo',         type: 'text',   width: W.long  },
  ], hotels.map(h => ({
    voyage_title: title(h.voyages),
    stay_date: parseDateOnly(h.stay_date),
    hotel_name: h.hotel_name,
    room_rate: h.room_rate,
    currency: h.currency,
    memo: h.memo,
  })))

  if (includeSheets.has('cabinGrades')) addStyledSheet(wb, '캐빈등급(보유현황)', [
    { header: '행사명',   key: 'voyage_title',      type: 'text',   width: W.title },
    { header: '등급',     key: 'grade',             type: 'text',   width: W.code  },
    { header: '인실',     key: 'occupancy',         type: 'number', width: W.short },
    { header: '보유',     key: 'total',             type: 'number', width: W.short },
    { header: '예약',     key: 'reserved',          type: 'number', width: W.short },
    { header: '인당가격', key: 'price_per_person',  type: 'number', width: W.krw   },
    { header: 'CCF',      key: 'ccf',               type: 'number', width: W.short },
    { header: 'NCCF',     key: 'nccf',              type: 'number', width: W.short },
    { header: 'TAX',      key: 'tax',               type: 'number', width: W.short },
    { header: 'TIP',      key: 'tip',               type: 'number', width: W.short },
    { header: '통화',     key: 'currency',          type: 'text',   width: W.short },
    { header: '에이전트', key: 'agent',             type: 'text',   width: W.label },
  ], cabinGrades.map(g => ({
    voyage_title: voyageTitleMap.get(g.voyage_id) ?? '',
    grade: g.grade,
    occupancy: g.occupancy,
    total: g.total,
    reserved: g.reserved,
    price_per_person: g.price_per_person,
    ccf: g.ccf,
    nccf: g.nccf,
    tax: g.tax,
    tip: g.tip,
    currency: g.currency,
    agent: g.agent,
  })))

  if (includeSheets.has('payments')) addStyledSheet(wb, '결제스케줄', [
    { header: '행사명',     key: 'voyage_title',  type: 'text',   width: W.title },
    { header: '구분',       key: 'category',      type: 'text',   width: W.code  },
    { header: '결제유형',   key: 'payment_type',  type: 'text',   width: W.label },
    { header: '섹션',       key: 'section',       type: 'text',   width: W.code  },
    { header: '에이전트ID', key: 'agent_id',      type: 'text',   width: W.label },
    { header: '금액',       key: 'amount',        type: 'number', width: W.krw   },
    { header: '통화',       key: 'currency',      type: 'text',   width: W.short },
    { header: '마감일',     key: 'due_date',      type: 'date',   width: W.date  },
    { header: '완료여부',   key: 'is_completed',  type: 'text',   width: W.code  },
    { header: '메모',       key: 'memo',          type: 'text',   width: W.long  },
  ], payments.map(p => ({
    voyage_title: title(p.voyages),
    category: p.category,
    payment_type: p.payment_type,
    section: p.section,
    agent_id: p.agent_id,
    amount: p.amount,
    currency: p.currency,
    due_date: parseDateOnly(p.due_date),
    is_completed: p.is_completed ? '완료' : '미완료',
    memo: p.memo,
  })))

  const today = new Date().toISOString().slice(0, 10)
  const filename = filterYears
    ? `이라이프투어_${[...filterYears].sort().join('_')}년_데이터_${today}.xlsx`
    : `이라이프투어_전체데이터_${today}.xlsx`
  await downloadWorkbook(wb, filename)

  return { filename, voyageCount: voyages.length }
}
