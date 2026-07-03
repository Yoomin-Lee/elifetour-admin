-- 캐빈 등급별 n인실(occupancy) 컬럼 추가
ALTER TABLE cabin_grades ADD COLUMN IF NOT EXISTS occupancy int;
ALTER TABLE cabin_grades ADD CONSTRAINT cabin_grades_occupancy_check CHECK (occupancy IS NULL OR occupancy BETWEEN 1 AND 4);
