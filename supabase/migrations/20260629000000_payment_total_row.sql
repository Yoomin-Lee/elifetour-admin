-- 총 금액 행 지원
-- 1. payment_type 에 TOTAL 허용
ALTER TABLE payment_schedules
  DROP CONSTRAINT IF EXISTS payment_schedules_payment_type_check;

ALTER TABLE payment_schedules
  ADD CONSTRAINT payment_schedules_payment_type_check CHECK (
    payment_type IN ('DEPOSIT_1ST', 'DEPOSIT_2ND', 'BALANCE', 'TOTAL')
    OR payment_type ~ '^DEPOSIT_[0-9]+$'
    OR payment_type ~ '^REFUND_[0-9]+$'
  );

-- 2. due_date nullable — TOTAL 행은 마감일 없음
ALTER TABLE payment_schedules
  ALTER COLUMN due_date DROP NOT NULL;
