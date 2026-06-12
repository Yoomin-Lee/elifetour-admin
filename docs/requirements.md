# 항차검색/행사 통합 조회 시스템 — Claude Code 개발 프롬프트

> 사용법: 이 파일을 프로젝트 루트에 `CLAUDE.md` 또는 `docs/requirements.md`로 저장하고,
> 클로드 코드에서 단계별 프롬프트(맨 아래 섹션)를 순서대로 실행하세요.
> 스프레드시트 스크린샷도 함께 첨부하면 레이아웃 재현 정확도가 올라갑니다.

---

## 1. 프로젝트 개요

크루즈 여행사 내부용 웹 정보 시스템. 기존에 구글 스프레드시트로 관리하던
"항차검색/행사 통합 조회" 시트를 웹 애플리케이션으로 전환한다.

- 사용자: 회사 직원 (공유, 편집, 수정 가능해야 함)
- 핵심 UX: 상단에서 행사(항차)를 선택하면 해당 행사의 모든 정보가 한 화면에 표시됨
- 기존 시트의 정보 밀도와 한눈에 보이는 대시보드 느낌을 유지할 것

## 2. 기술 스택 (변경 금지)

- 백엔드/DB/인증: Supabase (PostgreSQL, Auth, RLS, Realtime)
- 프론트엔드: Next.js (App Router) + TypeScript
- UI: shadcn/ui + TailwindCSS
- 데이터 페칭: @supabase/ssr 기반 서버 컴포넌트 우선, 클라이언트 변이는 TanStack Query 또는 server actions
- 폼/검증: react-hook-form + zod

## 3. 데이터 모델 (스프레드시트 → DB 매핑)

### 3.1 voyages (행사/항차 마스터) — 시트의 "일정 선택" + "개요" 섹션

| 컬럼 | 타입 | 시트 원본 | 비고 |
|---|---|---|---|
| id | uuid PK | - | |
| title | text | 일정 선택 값 (예: "27/09/10 서부지중해") | 표시명, departure_date + region으로 자동 생성 가능 |
| region | text | 서부지중해 등 | 지역/상품명 |
| status | enum | 상태 (미오픈) | '미오픈', '판매중', '마감', '출발완료', '취소' 등 — 정확한 상태값은 운영자에게 확인 |
| airline | text | 항공사 | |
| cruise_line | text | 선사 (MSC) | |
| ship_name | text | 크루즈 (WORLD EUROPA) | |
| departure_date | date | 출발일 (27/09/10) | 시트의 YY/MM/DD 형식 → date로 정규화 |
| return_date | date | 귀국일 (27/09/19) | |
| cabin_total | int | 보유 캐빈 (32) | |
| cabin_remaining | int | 잔여 캐빈 (32) | 예약 모듈이 생기면 계산 컬럼으로 전환 고려 |
| customer_count | int | 고객 수 | |
| tour_leader | text | 인솔자 | |
| hotel | text | 호텔 | |
| created_at / updated_at | timestamptz | - | |

### 3.2 flights (항공) — 시트의 "항공" 섹션, voyage당 N개

편명(flight_no), 출발지(origin), 도착지(destination), 출발일(departure_date),
도착일(arrival_date), 출발시간(departure_time), 도착시간(arrival_time),
비행시간(duration), 요금(fare numeric), sort_order, voyage_id FK

### 3.3 itinerary_days (기항지 일정) — 시트의 "기항지" 섹션, voyage당 N개

| 컬럼 | 시트 원본 | 비고 |
|---|---|---|
| date | 날짜 (09/10(금)) | date 타입, 요일은 프론트에서 계산해 표시 |
| port | 기항지 (바르셀로나, 해상 등) | "해상"(sea day)도 하나의 행 |
| arrival_time | 도착 (09:00) | nullable — 첫날/해상일은 없음 |
| departure_time | 출발 (17:00) | nullable |
| category | 구분 | nullable |
| cost | 비용 | numeric, nullable |
| summary | 요약 | text |

### 3.4 cancellation_policies (취소료) — voyage당 N개 구간

구분(category: '크루즈' 등), 시작 D-(start_d_minus int, "~"는 null로 = 무제한),
종료 D-(end_d_minus int), 시작일(start_date), 종료일(end_date),
취소료 설명(fee_description text — "데포20%", "객실당 $150", "크루즈요금 25%",
"크루즈+항구세100%" 처럼 정액/정률/단위가 섞여 있으므로 텍스트로 보존하되,
fee_type enum('percent','fixed') + fee_value numeric + fee_unit('인당','객실당')
구조화 컬럼을 병행), 비고(note)

### 3.5 history_logs (히스토리) — voyage당 N개

logged_at(date), author(text — 추후 auth.users 연동), content(text)

- 직원이 수동으로 메모를 남기는 용도 (시트의 히스토리 섹션 그대로)
- 추가로 voyages/flights 등 주요 테이블 변경 시 자동 감사 로그를 trigger로
  남기는 audit_logs 테이블을 별도 구성 (수동 히스토리와 자동 로그는 분리)

### 3.6 공통 규칙

- 모든 자식 테이블: voyage_id uuid FK → voyages(id) ON DELETE CASCADE
- RLS: authenticated 사용자만 SELECT/INSERT/UPDATE/DELETE (사내 시스템)
- updated_at 자동 갱신 trigger
- 마이그레이션은 supabase/migrations/ 에 SQL 파일로 관리

## 4. 화면 구성

### 4.1 메인 조회 페이지 (/) — 시트 레이아웃 재현

- 상단 헤더: 페이지 타이틀 + 행사 선택 Combobox (shadcn Combobox, 검색 가능,
  "27/09/10 서부지중해" 형식으로 표시, 출발일 내림차순 정렬)
- 행사 선택 시 아래 5개 섹션을 카드 그리드로 표시:
  - 개요 카드 (2열 라벨-값 그리드): 상태는 Badge 컴포넌트로 색상 구분
  - 항공 테이블
  - 기항지 테이블 (날짜순)
  - 취소료 테이블 (현재 날짜가 속한 구간 행을 하이라이트)
  - 히스토리 리스트 (최신순) + 인라인으로 새 메모 추가 입력
- 데스크톱: 시트처럼 2단 배치 (좌: 개요+기항지+히스토리 / 우: 항공+취소료),
  모바일: 1단 스택
- URL에 ?voyage={id} 쿼리를 반영해 링크 공유 가능하게

### 4.2 편집

- 각 섹션 카드에 "편집" 버튼 → Dialog 또는 인라인 편집 모드
- 항공/기항지/취소료는 행 추가/삭제/수정이 가능한 editable table
- 저장 시 zod 검증 → server action → Supabase 반영 → 히스토리/감사 로그 기록
- Supabase Realtime 구독으로 다른 직원의 수정이 즉시 반영 (동시 편집 충돌은
  last-write-wins + 변경 toast 알림 수준으로 시작)

### 4.3 행사 관리

- /voyages: 전체 행사 목록 테이블 (상태/출발일/잔여캐빈 필터·정렬)
- /voyages/new: 새 행사 등록 폼
- 행사 복제 기능 (같은 항차를 다음 시즌에 재사용하는 경우가 많음)

### 4.4 인증

- Supabase Auth 이메일/비밀번호 (사내 직원 초대 방식)
- 미들웨어로 비로그인 접근 차단

## 5. 데이터 마이그레이션

- 기존 구글 시트를 CSV로 내보내 1회 임포트하는 스크립트(scripts/import-csv.ts) 작성
- 날짜 "27/09/10(금)" → 2027-09-10, "09/10(금)" → 행사 출발 연도 기준으로 파싱
- 임포트 전 dry-run 모드로 파싱 결과 미리보기 출력

## 6. 구현 단계 (이 순서대로 진행)

1. **Phase 1 — DB**: Supabase 마이그레이션 SQL 작성 (테이블, enum, FK, RLS,
   trigger), 타입 생성 (supabase gen types), 시드 데이터로 스크린샷의
   "27/09/10 서부지중해" 행사 1건 입력
2. **Phase 2 — 조회**: 메인 페이지 읽기 전용 버전 (행사 선택 + 5개 섹션 표시)
3. **Phase 3 — 편집**: 섹션별 편집 UI + server actions + 검증
4. **Phase 4 — 인증/실시간**: Supabase Auth, 미들웨어, Realtime 구독
5. **Phase 5 — 관리/마이그레이션**: 행사 목록/등록/복제, CSV 임포트 스크립트

각 Phase 완료 시 빌드(`next build`)와 타입체크가 통과해야 하며,
다음 Phase로 넘어가기 전에 멈추고 확인을 받을 것.

## 7. 코딩 규칙

- 서버 컴포넌트 우선, 'use client'는 상호작용이 필요한 곳에만
- DB 접근 로직은 lib/queries/ 에 함수로 분리, 컴포넌트에서 직접 쿼리 금지
- 모든 사용자 입력은 zod 스키마로 검증 (스키마는 lib/schemas/ 에 모아 클라이언트·서버 공용)
- 한국어 UI, 날짜 표시는 "YY/MM/DD(요일)" 형식 유틸 함수로 통일
- 금액은 통화 단위가 혼재($, 원)하므로 currency 컬럼 또는 표시 유틸 고려
- 컴포넌트는 shadcn/ui 우선 사용, 커스텀 스타일 최소화
