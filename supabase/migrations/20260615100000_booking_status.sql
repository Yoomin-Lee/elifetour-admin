-- eli_passengers 에 예약 단계 컬럼 추가
-- 문의 → 계약 → 잔금 → 여권 → 출발
ALTER TABLE eli_passengers
  ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'inquiry';
