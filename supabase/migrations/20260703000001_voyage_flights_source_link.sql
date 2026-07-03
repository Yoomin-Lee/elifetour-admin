-- voyage_flights가 어느 flights 행에서 미러링됐는지 추적하는 링크 컬럼.
-- 보유 현황에서 좌석/운임을 수정하거나 항공편을 추가/삭제할 때, 이 링크를 통해
-- flights 테이블(단일 소스)에도 반영한 뒤 voyage_flights를 재생성한다.
ALTER TABLE voyage_flights
  ADD COLUMN IF NOT EXISTS source_flight_id uuid REFERENCES flights(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS voyage_flights_source_flight_id_idx ON voyage_flights (source_flight_id);
