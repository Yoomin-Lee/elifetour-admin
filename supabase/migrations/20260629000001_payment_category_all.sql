-- category 제약조건을 LAND·INSURANCE 포함하도록 확장
ALTER TABLE payment_schedules
  DROP CONSTRAINT IF EXISTS payment_schedules_category_check;

ALTER TABLE payment_schedules
  ADD CONSTRAINT payment_schedules_category_check
  CHECK (category IN ('CRUISE', 'FLIGHT', 'HOTEL', 'LAND', 'INSURANCE'));
