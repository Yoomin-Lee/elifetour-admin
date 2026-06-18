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
  '동북아_6박_상해': {
    label: '동북아 6박7일 (상해 왕복)',
    nights: 6,
    ports: [
      { port: '상해',      arrival_time: '',      departure_time: '',      summary: '도착' },
      { port: '상해',      arrival_time: '',      departure_time: '16:30', summary: '크루즈 승선' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '나가사키',  arrival_time: '07:00', departure_time: '19:00', summary: '' },
      { port: '가고시마',  arrival_time: '08:00', departure_time: '19:00', summary: '' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '상해',      arrival_time: '07:00', departure_time: '',      summary: '하선·귀국' },
    ],
  },
  '동북아_6박_도쿄': {
    label: '동북아 6박 (도쿄 왕복)',
    nights: 6,
    ports: [
      { port: '도쿄 (일본)',      arrival_time: '10:50', departure_time: '',      summary: '도착' },
      { port: '도쿄 (일본)',      arrival_time: '',      departure_time: '16:00', summary: '크루즈 승선' },
      { port: '해상',             arrival_time: '',      departure_time: '',      summary: '' },
      { port: '제주 (한국)',      arrival_time: '12:30', departure_time: '21:00', summary: '' },
      { port: '가고시마 (일본)',  arrival_time: '13:00', departure_time: '21:00', summary: '' },
      { port: '해상',             arrival_time: '',      departure_time: '',      summary: '' },
      { port: '도쿄 (일본)',      arrival_time: '08:00', departure_time: '12:50', summary: '하선·귀국' },
    ],
  },
  '동북아_6박_홍콩': {
    label: '동북아 6박 (홍콩 왕복)',
    nights: 6,
    ports: [
      { port: '홍콩 (홍콩)',      arrival_time: '12:00', departure_time: '',      summary: '도착' },
      { port: '홍콩 (홍콩)',      arrival_time: '',      departure_time: '16:00', summary: '크루즈 승선' },
      { port: '해상',             arrival_time: '',      departure_time: '',      summary: '' },
      { port: '오키나와 (일본)',  arrival_time: '11:30', departure_time: '20:00', summary: '' },
      { port: '기륭 (대만)',      arrival_time: '13:00', departure_time: '23:00', summary: '' },
      { port: '해상',             arrival_time: '',      departure_time: '',      summary: '' },
      { port: '홍콩 (홍콩)',      arrival_time: '06:30', departure_time: '13:10', summary: '하선·귀국' },
    ],
  },

  // ── 알래스카 ──────────────────────────────────────────────────────────────
  '알래스카_8박': {
    label: '알래스카 8박9일 (시애틀 왕복)',
    nights: 8,
    ports: [
      { port: '시애틀',      arrival_time: '',      departure_time: '',      summary: '도착' },
      { port: '시애틀',      arrival_time: '',      departure_time: '16:00', summary: '크루즈 승선' },
      { port: '해상',        arrival_time: '',      departure_time: '',      summary: '' },
      { port: '싯카',        arrival_time: '09:30', departure_time: '17:00', summary: '' },
      { port: '스캐그웨이',  arrival_time: '07:00', departure_time: '20:00', summary: '' },
      { port: '주노',        arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '해상',        arrival_time: '',      departure_time: '',      summary: '' },
      { port: '빅토리아',    arrival_time: '15:00', departure_time: '22:00', summary: '' },
      { port: '시애틀',      arrival_time: '06:00', departure_time: '',      summary: '하선·귀국' },
    ],
  },

  // ── 미서부 ────────────────────────────────────────────────────────────────
  '미서부_8박': {
    label: '미서부 8박9일 (LA 왕복)',
    nights: 8,
    ports: [
      { port: 'LA',          arrival_time: '',      departure_time: '',      summary: '도착' },
      { port: '페이지',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '라스베가스',  arrival_time: '',      departure_time: '',      summary: '' },
      { port: 'LA',          arrival_time: '',      departure_time: '16:00', summary: '크루즈 승선' },
      { port: '해상',        arrival_time: '',      departure_time: '',      summary: '' },
      { port: '카탈리나',    arrival_time: '07:00', departure_time: '18:00', summary: '' },
      { port: '앤세나다',    arrival_time: '08:00', departure_time: '17:00', summary: '' },
      { port: 'LA',          arrival_time: '07:00', departure_time: '',      summary: '하선' },
      { port: 'LA',          arrival_time: '',      departure_time: '',      summary: '귀국' },
    ],
  },

  // ── 아라비아반도 ──────────────────────────────────────────────────────────
  '아라비아반도_7박': {
    label: '아라비아반도 7박 (두바이 왕복)',
    nights: 7,
    ports: [
      { port: '두바이 (아랍에미리트)',   arrival_time: '',      departure_time: '',      summary: '도착' },
      { port: '두바이 (아랍에미리트)',   arrival_time: '',      departure_time: '',      summary: '' },
      { port: '두바이 (아랍에미리트)',   arrival_time: '',      departure_time: '13:00', summary: '크루즈 승선' },
      { port: '무스카트 (오만)',         arrival_time: '08:30', departure_time: '19:00', summary: '' },
      { port: '해상',                    arrival_time: '',      departure_time: '',      summary: '' },
      { port: '도하 (카타르)',           arrival_time: '07:00', departure_time: '18:00', summary: '' },
      { port: '아부다비 (아랍에미리트)', arrival_time: '07:30', departure_time: '22:00', summary: '' },
      { port: '두바이 (아랍에미리트)',   arrival_time: '07:00', departure_time: '',      summary: '하선·귀국' },
    ],
  },

  // ── 서부지중해 ────────────────────────────────────────────────────────────
  '서부지중해_8박_바르셀로나': {
    label: '서부지중해 8박9일 (바르셀로나 왕복)',
    nights: 8,
    ports: [
      { port: '바르셀로나', arrival_time: '19:10', departure_time: '',      summary: '도착' },
      { port: '바르셀로나', arrival_time: '',      departure_time: '18:00', summary: '크루즈 승선' },
      { port: '해상',       arrival_time: '',      departure_time: '',      summary: '' },
      { port: '칼리아리',   arrival_time: '07:00', departure_time: '16:00', summary: '사르데냐' },
      { port: '나폴리',     arrival_time: '09:00', departure_time: '19:00', summary: '' },
      { port: '로마',       arrival_time: '08:00', departure_time: '19:00', summary: '치비타베키아' },
      { port: '제노바',     arrival_time: '08:30', departure_time: '18:00', summary: '' },
      { port: '마르세유',   arrival_time: '09:00', departure_time: '18:00', summary: '' },
      { port: '바르셀로나', arrival_time: '08:00', departure_time: '19:35', summary: '하선·귀국' },
    ],
  },

  // ── 동부지중해 ────────────────────────────────────────────────────────────
  '동부지중해_8박_베니스': {
    label: '동부지중해 8박 (베니스 왕복)',
    nights: 8,
    ports: [
      { port: '베니스 (이탈리아)',         arrival_time: '19:00', departure_time: '',      summary: '도착' },
      { port: '베니스 (이탈리아)',         arrival_time: '',      departure_time: '17:00', summary: '크루즈 승선' },
      { port: '바리 (이탈리아)',           arrival_time: '14:00', departure_time: '20:00', summary: '알베로벨로 (쇼렉스 €79)' },
      { port: '코르푸 (그리스)',           arrival_time: '09:00', departure_time: '19:00', summary: '팔레오카스트릿차/카노니/올드타운 (쇼렉스 €79)' },
      { port: '아르고스톨리 (그리스)',     arrival_time: '07:30', departure_time: '15:30', summary: '멜리사니 동굴/미르토스 해변/아기아 에피미아 (쇼렉스 €59)' },
      { port: '두브로브니크 (크로아티아)', arrival_time: '10:00', departure_time: '20:00', summary: '성벽투어 (쇼렉스 €99)' },
      { port: '코토르 (몬테네그로)',       arrival_time: '08:00', departure_time: '18:00', summary: '페라스트/암굴의 성모성당/올드타운 (쇼렉스 €55)' },
      { port: '자다르 (크로아티아)',       arrival_time: '12:00', departure_time: '20:00', summary: '크르카 국립공원 (쇼렉스 €95)' },
      { port: '베니스 (이탈리아)',         arrival_time: '08:00', departure_time: '',      summary: '하선·귀국' },
    ],
  },
  '동부지중해_8박_이스탄불': {
    label: '동부지중해 8박9일 (이스탄불 왕복)',
    nights: 8,
    ports: [
      { port: '이스탄불',  arrival_time: '',      departure_time: '',      summary: '도착' },
      { port: '이스탄불',  arrival_time: '',      departure_time: '17:30', summary: '크루즈 승선' },
      { port: '이즈미르',  arrival_time: '13:00', departure_time: '19:00', summary: '' },
      { port: '볼로스',    arrival_time: '09:00', departure_time: '18:00', summary: '' },
      { port: '산토리니',  arrival_time: '10:00', departure_time: '20:00', summary: '' },
      { port: '나플리오',  arrival_time: '09:00', departure_time: '19:00', summary: '' },
      { port: '아테네',    arrival_time: '05:00', departure_time: '23:00', summary: '' },
      { port: '해상',      arrival_time: '',      departure_time: '',      summary: '' },
      { port: '이스탄불',  arrival_time: '07:00', departure_time: '',      summary: '하선·귀국' },
    ],
  },

  // ── 북유럽 ────────────────────────────────────────────────────────────────
  '북유럽_8박_로테르담': {
    label: '북유럽 8박 (로테르담 왕복)',
    nights: 8,
    ports: [
      { port: '로테르담 (네덜란드)', arrival_time: '',      departure_time: '',      summary: '도착' },
      { port: '로테르담 (네덜란드)', arrival_time: '',      departure_time: '15:00', summary: '크루즈 승선' },
      { port: '해상',                arrival_time: '',      departure_time: '',      summary: '' },
      { port: '오다 (노르웨이)',     arrival_time: '07:00', departure_time: '16:00', summary: '' },
      { port: '올레순 (노르웨이)',   arrival_time: '11:00', departure_time: '23:00', summary: '' },
      { port: '올덴 (노르웨이)',     arrival_time: '08:00', departure_time: '18:00', summary: '' },
      { port: '베르겐 (노르웨이)',   arrival_time: '08:00', departure_time: '17:00', summary: '' },
      { port: '해상',                arrival_time: '',      departure_time: '',      summary: '' },
      { port: '로테르담 (네덜란드)', arrival_time: '07:00', departure_time: '',      summary: '하선·귀국' },
    ],
  },

}

export const PRESET_OPTIONS = Object.entries(ITINERARY_PRESETS).map(([key, preset]) => ({
  value: key,
  label: preset.label,
}))
