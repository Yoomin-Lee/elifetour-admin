-- 결제/환불 섹션 구분을 위한 section 컬럼 추가
ALTER TABLE payment_schedules
  ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'PAYMENT';

ALTER TABLE payment_schedules
  ADD CONSTRAINT payment_schedules_section_check
  CHECK (section IN ('PAYMENT', 'REFUND'));

-- 기존 UNIQUE 제약 제거 후 section 포함으로 교체
ALTER TABLE payment_schedules
  DROP CONSTRAINT IF EXISTS payment_schedules_voyage_id_category_payment_type_key;

ALTER TABLE payment_schedules
  ADD CONSTRAINT payment_schedules_voyage_id_category_payment_type_section_key
  UNIQUE (voyage_id, category, payment_type, section);
