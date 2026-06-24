-- 환불 카드 타입(REFUND_1, REFUND_2 ...)을 허용하기 위해 payment_type CHECK 완화
ALTER TABLE payment_schedules
  DROP CONSTRAINT IF EXISTS payment_schedules_payment_type_check;

ALTER TABLE payment_schedules
  ADD CONSTRAINT payment_schedules_payment_type_check CHECK (
    payment_type IN ('DEPOSIT_1ST', 'DEPOSIT_2ND', 'BALANCE')
    OR payment_type ~ '^DEPOSIT_[0-9]+$'
    OR payment_type ~ '^REFUND_[0-9]+$'
  );
