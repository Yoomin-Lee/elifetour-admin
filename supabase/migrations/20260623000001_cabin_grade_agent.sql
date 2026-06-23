-- 캐빈 등급별 에이전트 컬럼 추가
ALTER TABLE cabin_grades ADD COLUMN IF NOT EXISTS agent text;
