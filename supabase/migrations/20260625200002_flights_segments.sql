-- flights 테이블: 편명·날짜·시각 구간을 JSONB 배열로 저장
ALTER TABLE flights
  ADD COLUMN IF NOT EXISTS segments JSONB NOT NULL DEFAULT '[]';
