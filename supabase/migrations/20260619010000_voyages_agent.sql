-- voyages 테이블에 에이전트(현지 파트너) 컬럼 추가
ALTER TABLE voyages
  ADD COLUMN IF NOT EXISTS agent text;
