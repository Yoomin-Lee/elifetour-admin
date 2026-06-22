-- 취소료 행별 기준일 직접 지정 (항공 2개, 크루즈 2개 등 날짜 다를 때 개별 설정)
ALTER TABLE cancellation_policies ADD COLUMN IF NOT EXISTS reference_date DATE;
