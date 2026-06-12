# elifetour-admin — 이라이프투어 직원 관리 시스템

React 19 + Vite 7 + Supabase + Tailwind CSS 기반의 여행사 내부 직원용 웹 앱.

## 스택 / 배포
- React 19 · Vite 7 · React Router 7 · Supabase JS · Tailwind CSS 3
- GitHub Actions(`.github/workflows/deploy.yml`) → GitHub Pages 자동 배포 (`main` push)
- base path: `/elifetour-admin/` (GitHub Pages 서브 경로)
- 인증: Supabase Auth — **Google OAuth** (직원 전용)
- DB: Supabase PostgreSQL, 테이블 접두사 `eli_`

## Supabase
- 프로젝트: `fnrghzzqwergwcssybro` (elifetour-admin, ap-northeast-2)
- URL: `https://fnrghzzqwergwcssybro.supabase.co`
- **Google OAuth 활성화 필요**: Supabase 대시보드 > Auth > Providers > Google
- 스키마: `supabase/schema.sql`, 마이그레이션: `supabase/migrations/`

## 환경변수 (.env.local — git 제외)
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, `VITE_TABLE_PREFIX=eli_`  
`SUPABASE_ACCESS_TOKEN`(sbp_)은 CLI 전용. Actions 시크릿 동일하게 등록 완료.

## 주요 기능 (Phase 1)
- **여행 일정 관리**: CRUD, 상태(예정/진행중/완료/취소), 담당자, 메모
- **여행자 명단**: 여행별 탑승자 CRUD, 결제 상태 추적, CSV 내보내기
- **전체 명단 검색**: 이름·연락처·여권번호로 전체 여행자 검색
- **모바일 반응형**: 사이드바 접기/펼치기, 모바일 카드 레이아웃

## 디렉터리
- `src/config/site.js` — 브랜드, 상태 옵션 상수
- `src/lib/trips.js` — 여행 CRUD 함수
- `src/lib/passengers.js` — 여행자 CRUD 함수
- `src/components/Layout.jsx` — 사이드바 + 탑바 레이아웃
- `src/components/TripForm.jsx` — 여행 등록/수정 폼
- `src/components/PassengerForm.jsx` — 여행자 등록/수정 폼
- `supabase/schema.sql` — 전체 테이블 정의 (eli_profiles, eli_trips, eli_passengers)

## 다음 개발 계획 (Phase 2+)
- 예약 상태 트래킹 (문의→완료→잔금→여권→출발)
- 달력형 일정 스케줄러
- 협력업체(랜드사/호텔) DB
- 역할별 권한 분리 (admin/staff/guide)
- 영수증 업로드 (Supabase Storage)
- 사내 위키 (Knowledge Base)
