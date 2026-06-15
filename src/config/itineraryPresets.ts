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
  '서부지중해_7박': {
    label: '서부지중해 7박 (바르셀로나 왕복)',
    nights: 7,
    ports: [
      { port: '바르셀로나 (스페인)',     arrival_time: '',      departure_time: '17:00', summary: '출발' },
      { port: '해상',                    arrival_time: '',      departure_time: '',      summary: '' },
      { port: '마르세유 (프랑스)',       arrival_time: '08:00', departure_time: '18:00', summary: '' },
      { port: '제노바 (이탈리아)',       arrival_time: '07:00', departure_time: '19:00', summary: '' },
      { port: '라스페치아 (이탈리아)',   arrival_time: '07:00', departure_time: '19:00', summary: '피사·친퀘테레' },
      { port: '치비타베키아 (이탈리아)', arrival_time: '07:00', departure_time: '19:00', summary: '로마' },
      { port: '나폴리 (이탈리아)',       arrival_time: '07:00', departure_time: '19:00', summary: '폼페이·아말피' },
      { port: '바르셀로나 (스페인)',     arrival_time: '08:00', departure_time: '',      summary: '귀항' },
    ],
  },
  '서부지중해_10박': {
    label: '서부지중해 10박 (바르셀로나↔제노바)',
    nights: 10,
    ports: [
      { port: '바르셀로나 (스페인)',     arrival_time: '',      departure_time: '17:00', summary: '출발' },
      { port: '팔마 (스페인)',           arrival_time: '07:00', departure_time: '17:00', summary: '마요르카' },
      { port: '발렌시아 (스페인)',       arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '말라가 (스페인)',         arrival_time: '07:00', departure_time: '17:00', summary: '알람브라' },
      { port: '해상',                    arrival_time: '',      departure_time: '',      summary: '' },
      { port: '치비타베키아 (이탈리아)', arrival_time: '07:00', departure_time: '19:00', summary: '로마' },
      { port: '나폴리 (이탈리아)',       arrival_time: '07:00', departure_time: '19:00', summary: '폼페이' },
      { port: '메시나 (이탈리아)',       arrival_time: '07:00', departure_time: '17:00', summary: '시칠리아·타오르미나' },
      { port: '팔레르모 (이탈리아)',     arrival_time: '08:00', departure_time: '18:00', summary: '시칠리아' },
      { port: '해상',                    arrival_time: '',      departure_time: '',      summary: '' },
      { port: '제노바 (이탈리아)',       arrival_time: '07:00', departure_time: '',      summary: '귀항' },
    ],
  },
  '동부지중해_7박': {
    label: '동부지중해 7박 (피레우스 왕복)',
    nights: 7,
    ports: [
      { port: '피레우스 (그리스)',       arrival_time: '',      departure_time: '17:00', summary: '아테네 출발' },
      { port: '산토리니 (그리스)',       arrival_time: '07:00', departure_time: '19:00', summary: '' },
      { port: '이라클리온 (그리스)',     arrival_time: '07:00', departure_time: '18:00', summary: '크레타' },
      { port: '카타콜론 (그리스)',       arrival_time: '07:00', departure_time: '16:00', summary: '올림피아' },
      { port: '두브로브니크 (크로아티아)', arrival_time: '08:00', departure_time: '18:00', summary: '' },
      { port: '코르푸 (그리스)',         arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '해상',                    arrival_time: '',      departure_time: '',      summary: '' },
      { port: '피레우스 (그리스)',       arrival_time: '07:00', departure_time: '',      summary: '아테네 귀항' },
    ],
  },
  '발트해_10박': {
    label: '발트해 10박 (코펜하겐 왕복)',
    nights: 10,
    ports: [
      { port: '코펜하겐 (덴마크)',            arrival_time: '',      departure_time: '17:00', summary: '출발' },
      { port: '베를린·바르네뮌데 (독일)',     arrival_time: '07:00', departure_time: '19:00', summary: '' },
      { port: '탈린 (에스토니아)',             arrival_time: '07:00', departure_time: '18:00', summary: '' },
      { port: '상트페테르부르크 (러시아)',     arrival_time: '08:00', departure_time: '',      summary: '1박' },
      { port: '상트페테르부르크 (러시아)',     arrival_time: '',      departure_time: '18:00', summary: '' },
      { port: '헬싱키 (핀란드)',               arrival_time: '08:00', departure_time: '18:00', summary: '' },
      { port: '스톡홀름 (스웨덴)',             arrival_time: '08:00', departure_time: '18:00', summary: '' },
      { port: '오슬로 (노르웨이)',             arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '해상',                          arrival_time: '',      departure_time: '',      summary: '' },
      { port: '코펜하겐 (덴마크)',             arrival_time: '07:00', departure_time: '',      summary: '귀항' },
    ],
  },
  '노르웨이피오르드_7박': {
    label: '노르웨이 피오르드 7박',
    nights: 7,
    ports: [
      { port: '베르겐 (노르웨이)',        arrival_time: '',      departure_time: '17:00', summary: '출발' },
      { port: '올레순 (노르웨이)',        arrival_time: '07:00', departure_time: '18:00', summary: '' },
      { port: '게이랑에르 (노르웨이)',    arrival_time: '07:00', departure_time: '15:00', summary: '게이랑에르피오르드' },
      { port: '플롬 (노르웨이)',          arrival_time: '08:00', departure_time: '18:00', summary: '송네피오르드' },
      { port: '스타방에르 (노르웨이)',    arrival_time: '07:00', departure_time: '17:00', summary: '프레이케스톨렌' },
      { port: '해상',                     arrival_time: '',      departure_time: '',      summary: '' },
      { port: '코펜하겐 (덴마크)',        arrival_time: '',      departure_time: '17:00', summary: '' },
      { port: '베르겐 (노르웨이)',        arrival_time: '08:00', departure_time: '',      summary: '귀항' },
    ],
  },
  '카리브해_7박': {
    label: '카리브해 7박 (마이애미 왕복)',
    nights: 7,
    ports: [
      { port: '마이애미 (미국)',             arrival_time: '',      departure_time: '17:00', summary: '출발' },
      { port: '나소 (바하마)',               arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '코코 케이 (바하마)',          arrival_time: '08:00', departure_time: '17:00', summary: '프라이빗 아일랜드' },
      { port: '로아탄 (온두라스)',           arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '벨리즈 (벨리즈)',            arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '코수멜 (멕시코)',             arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '해상',                        arrival_time: '',      departure_time: '',      summary: '' },
      { port: '마이애미 (미국)',             arrival_time: '07:00', departure_time: '',      summary: '귀항' },
    ],
  },
  '알래스카_7박': {
    label: '알래스카 7박 (시애틀 왕복)',
    nights: 7,
    ports: [
      { port: '시애틀 (미국)',               arrival_time: '',      departure_time: '17:00', summary: '출발' },
      { port: '케치칸 (미국)',               arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '주노 (미국)',                 arrival_time: '07:00', departure_time: '18:00', summary: '' },
      { port: '스카그웨이 (미국)',           arrival_time: '07:00', departure_time: '17:00', summary: '' },
      { port: '글레이셔 베이 (미국)',        arrival_time: '07:00', departure_time: '17:00', summary: '자연탐방' },
      { port: '빅토리아 (캐나다)',           arrival_time: '18:00', departure_time: '23:59', summary: '' },
      { port: '시애틀 (미국)',               arrival_time: '07:00', departure_time: '',      summary: '귀항' },
    ],
  },
}

export const PRESET_OPTIONS = Object.entries(ITINERARY_PRESETS).map(([key, preset]) => ({
  value: key,
  label: preset.label,
}))
