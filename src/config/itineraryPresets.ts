export type PresetPort = {
  port: string
  arrival_time: string
  departure_time: string
  summary: string
}

export type ItineraryPreset = {
  label: string
  nights: number
  ports: PresetPort[]
}

export const ITINERARY_PRESETS: Record<string, ItineraryPreset> = {
  // ── 싱가포르 ──────────────────────────────────────────────────────────────
  '싱가포르_5박': {
    label: '싱가포르 5박6일 (싱가포르 왕복)',
    nights: 5,
    ports: [
      { port: '싱가포르',  arrival_time: '14:25', departure_time: '',      summary: '도착' },
      { port: '싱가포르',  arrival_time: '',      departure_time: '16:00', summary: '크루즈 승선' },
      { port: '페낭',      arrival_time: '14:30', departure_time: '21:00', summary: '' },
      { port: '푸켓',      arrival_time: '08:00', departure_time: '20:00', summary: '' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '싱가포르',  arrival_time: '07:00', departure_time: '',      summary: '하선·귀국' },
    ],
  },

  // ── 동북아 ────────────────────────────────────────────────────────────────
  '동북아_5박_상해': {
    label: '동북아 5박 (상해 왕복)',
    nights: 5,
    ports: [
      { port: '상해',      arrival_time: '',      departure_time: '16:30', summary: '출발' },
      { port: '상해',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '가고시마',  arrival_time: '07:00', departure_time: '18:00', summary: '' },
      { port: '오키나와',  arrival_time: '13:00', departure_time: '22:00', summary: '' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '상해',      arrival_time: '07:00', departure_time: '',      summary: '귀항' },
    ],
  },
  '동북아_5박_도쿄': {
    label: '동북아 5박 (도쿄 왕복)',
    nights: 5,
    ports: [
      { port: '도쿄',      arrival_time: '',      departure_time: '16:00', summary: '출발' },
      { port: '도쿄',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '제주',      arrival_time: '12:30', departure_time: '21:00', summary: '' },
      { port: '가고시마',  arrival_time: '13:00', departure_time: '21:00', summary: '' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '도쿄',      arrival_time: '08:00', departure_time: '',      summary: '귀항' },
    ],
  },

  // ── 알래스카 ──────────────────────────────────────────────────────────────
  '알래스카_7박': {
    label: '알래스카 7박 (시애틀 왕복)',
    nights: 7,
    ports: [
      { port: '시애틀',      arrival_time: '',      departure_time: '15:00', summary: '출발' },
      { port: '시애틀',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '해상',        arrival_time: '',      departure_time: '',      summary: '' },
      { port: '주노',        arrival_time: '12:30', departure_time: '22:30', summary: '' },
      { port: '도스빙하',    arrival_time: '08:00', departure_time: '14:30', summary: '' },
      { port: '싯카',        arrival_time: '08:00', departure_time: '16:00', summary: '' },
      { port: '케치칸',      arrival_time: '07:00', departure_time: '13:00', summary: '' },
      { port: '빅토리아',    arrival_time: '20:00', departure_time: '23:59', summary: '' },
      { port: '시애틀',      arrival_time: '07:00', departure_time: '',      summary: '귀항' },
    ],
  },

  // ── 미서부 ────────────────────────────────────────────────────────────────
  '미서부_8박': {
    label: '미서부 8박9일 (LA 왕복)',
    nights: 8,
    ports: [
      { port: 'LA',        arrival_time: '',      departure_time: '',      summary: '도착' },
      { port: '페이지',    arrival_time: '',      departure_time: '',      summary: '' },
      { port: '라스베가스',arrival_time: '',      departure_time: '',      summary: '' },
      { port: 'LA',        arrival_time: '',      departure_time: '16:00', summary: '크루즈 승선' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '카탈리나',  arrival_time: '07:00', departure_time: '18:00', summary: '' },
      { port: '앤세나다',  arrival_time: '08:00', departure_time: '17:00', summary: '' },
      { port: 'LA',        arrival_time: '07:00', departure_time: '',      summary: '하선' },
      { port: 'LA',        arrival_time: '',      departure_time: '',      summary: '귀국' },
    ],
  },

  // ── 두바이 ────────────────────────────────────────────────────────────────
  '두바이_7박': {
    label: '두바이 7박',
    nights: 7,
    ports: [
      { port: '두바이',    arrival_time: '',      departure_time: '',      summary: '출발' },
      { port: '두바이',    arrival_time: '',      departure_time: '13:00', summary: '' },
      { port: '무스카트',  arrival_time: '08:30', departure_time: '19:00', summary: '' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '도하',      arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '아부다비',  arrival_time: '06:30', departure_time: '23:00', summary: '' },
      { port: '두바이',    arrival_time: '08:00', departure_time: '',      summary: '귀항' },
    ],
  },

  // ── 서부지중해 ────────────────────────────────────────────────────────────
  '서부지중해_7박_바르셀로나': {
    label: '서부지중해 7박 (바르셀로나 왕복)',
    nights: 7,
    ports: [
      { port: '바르셀로나', arrival_time: '',      departure_time: '18:00', summary: '출발' },
      { port: '마르세유',   arrival_time: '07:00', departure_time: '18:00', summary: '' },
      { port: '제노바',     arrival_time: '08:00', departure_time: '16:00', summary: '' },
      { port: '나폴리',     arrival_time: '13:00', departure_time: '20:00', summary: '' },
      { port: '메시나',     arrival_time: '09:00', departure_time: '18:00', summary: '타오르미나' },
      { port: '발레타',     arrival_time: '08:00', departure_time: '17:00', summary: '' },
      { port: '해상',       arrival_time: '',      departure_time: '',      summary: '' },
      { port: '바르셀로나', arrival_time: '08:00', departure_time: '',      summary: '귀항' },
    ],
  },
  '서부지중해_7박_라스페치아': {
    label: '서부지중해 7박 (바르셀로나↔라스페치아)',
    nights: 7,
    ports: [
      { port: '바르셀로나', arrival_time: '',      departure_time: '18:00', summary: '출발' },
      { port: '마르세유',   arrival_time: '07:00', departure_time: '18:00', summary: '' },
      { port: '제노바',     arrival_time: '08:00', departure_time: '16:00', summary: '' },
      { port: '라스페치아', arrival_time: '07:00', departure_time: '18:00', summary: '피사/루카' },
      { port: '로마',       arrival_time: '07:00', departure_time: '',      summary: '귀항' },
    ],
  },

  // ── 동부지중해 ────────────────────────────────────────────────────────────
  '동부지중해_7박_로마': {
    label: '동부지중해 7박 (로마 왕복)',
    nights: 7,
    ports: [
      { port: '로마',      arrival_time: '',      departure_time: '17:00', summary: '출발' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '산토리니',  arrival_time: '11:00', departure_time: '22:00', summary: '' },
      { port: '쿠사다시',  arrival_time: '09:00', departure_time: '18:00', summary: '에페소' },
      { port: '미코노스',  arrival_time: '07:00', departure_time: '18:00', summary: '' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '나폴리',    arrival_time: '07:00', departure_time: '18:00', summary: '폼페이' },
      { port: '로마',      arrival_time: '05:00', departure_time: '',      summary: '귀항' },
    ],
  },
  '동부지중해_7박_베니스': {
    label: '동부지중해 7박 (베니스 왕복)',
    nights: 7,
    ports: [
      { port: '베니스',      arrival_time: '',      departure_time: '17:00', summary: '출발' },
      { port: '바리',        arrival_time: '14:00', departure_time: '20:00', summary: '알베로벨로' },
      { port: '코르푸',      arrival_time: '09:00', departure_time: '19:00', summary: '' },
      { port: '아르고스톨리',arrival_time: '07:30', departure_time: '15:30', summary: '' },
      { port: '두브로브니크',arrival_time: '10:00', departure_time: '20:00', summary: '성벽투어' },
      { port: '코토르',      arrival_time: '08:00', departure_time: '18:00', summary: '' },
      { port: '자다르',      arrival_time: '12:00', departure_time: '20:00', summary: '' },
      { port: '베니스',      arrival_time: '08:00', departure_time: '',      summary: '귀항' },
    ],
  },
  '동부지중해_7박_이스탄불': {
    label: '동부지중해 7박 (이스탄불 왕복)',
    nights: 7,
    ports: [
      { port: '이스탄불',  arrival_time: '',      departure_time: '17:30', summary: '출발' },
      { port: '이즈미르',  arrival_time: '13:00', departure_time: '19:00', summary: '' },
      { port: '볼로스',    arrival_time: '09:00', departure_time: '18:00', summary: '' },
      { port: '산토리니',  arrival_time: '10:00', departure_time: '20:00', summary: '' },
      { port: '나플리오',  arrival_time: '09:00', departure_time: '19:00', summary: '' },
      { port: '아테네',    arrival_time: '05:00', departure_time: '23:00', summary: '' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '이스탄불',  arrival_time: '07:00', departure_time: '',      summary: '귀항' },
    ],
  },

  // ── 북유럽 ────────────────────────────────────────────────────────────────
  '북유럽_7박_로테르담': {
    label: '북유럽 7박 (로테르담 왕복)',
    nights: 7,
    ports: [
      { port: '로테르담',  arrival_time: '',      departure_time: '15:00', summary: '출발' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '오다',      arrival_time: '07:00', departure_time: '16:00', summary: '' },
      { port: '올레순',    arrival_time: '11:00', departure_time: '23:00', summary: '' },
      { port: '올덴',      arrival_time: '08:00', departure_time: '18:00', summary: '' },
      { port: '베르겐',    arrival_time: '08:00', departure_time: '17:00', summary: '' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '로테르담',  arrival_time: '07:00', departure_time: '',      summary: '귀항' },
    ],
  },

  // ── 카리브해 ──────────────────────────────────────────────────────────────
  '카리브해_6박': {
    label: '카리브해 6박 (포트로더데일 왕복)',
    nights: 6,
    ports: [
      { port: '포트로더데일', arrival_time: '',      departure_time: '16:00', summary: '출발' },
      { port: '나소',         arrival_time: '08:00', departure_time: '17:00', summary: '' },
      { port: '해상',         arrival_time: '',      departure_time: '',      summary: '' },
      { port: '팔머스',       arrival_time: '07:00', departure_time: '15:30', summary: '' },
      { port: '라바디',       arrival_time: '09:00', departure_time: '17:00', summary: '' },
      { port: '해상',         arrival_time: '',      departure_time: '',      summary: '' },
      { port: '포트로더데일', arrival_time: '06:00', departure_time: '',      summary: '귀항' },
    ],
  },
}

export const PRESET_OPTIONS = Object.entries(ITINERARY_PRESETS).map(([key, preset]) => ({
  value: key,
  label: preset.label,
}))
