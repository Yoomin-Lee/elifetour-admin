-- 추가 데포짓(3차, 4차…)을 지원하기 위해 payment_type CHECK 제약 완화
-- 기존 값(DEPOSIT_1ST, DEPOSIT_2ND, BALANCE) + DEPOSIT_N(숫자) 형식 허용
ALTER TABLE payment_schedules
  DROP CONSTRAINT IF EXISTS payment_schedules_payment_type_check;

ALTER TABLE payment_schedules
  ADD CONSTRAINT payment_schedules_payment_type_check CHECK (
    payment_type IN ('DEPOSIT_1ST', 'DEPOSIT_2ND', 'BALANCE')
    OR payment_type ~ '^DEPOSIT_[0-9]+$'
  );
