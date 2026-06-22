-- 크루즈 승선일 컬럼 추가 (취소료 D-day 기준일 분리용)
ALTER TABLE voyages ADD COLUMN IF NOT EXISTS boarding_date DATE;
