-- eli_passengers에 voyage_id 컬럼 추가 (기존 trip_id는 유지)
ALTER TABLE eli_passengers
  ADD COLUMN IF NOT EXISTS voyage_id uuid REFERENCES voyages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_eli_passengers_voyage_id ON eli_passengers(voyage_id);
