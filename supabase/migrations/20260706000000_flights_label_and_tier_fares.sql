-- flights 테이블: "N편" 기본 라벨을 대신할 사용자 지정 이름 + 좌석 등급(인디비/비즈니스)별 항공료 분류 추가
-- 기존 fare_base/fare_fuel/fare_tax는 그룹석 요금으로 그대로 유지(디폴트 값)
ALTER TABLE flights
  ADD COLUMN IF NOT EXISTS label              TEXT,
  ADD COLUMN IF NOT EXISTS fare_base_indivi    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fare_fuel_indivi    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fare_tax_indivi     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fare_base_business  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fare_fuel_business  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fare_tax_business   INTEGER NOT NULL DEFAULT 0;
