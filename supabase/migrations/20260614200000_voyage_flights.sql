-- voyage_flights: TIMESTAMPTZ 기반 항공편 테이블
-- dep_datetime / arr_datetime 에 공항 현지 시각+오프셋을 저장하면 PostgreSQL이 UTC로 보관
CREATE TABLE IF NOT EXISTS voyage_flights (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  voyage_id      UUID        NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  pnr            TEXT,
  flight_num     TEXT        NOT NULL,
  dep_airport    TEXT        NOT NULL,
  arr_airport    TEXT        NOT NULL,
  dep_datetime   TIMESTAMPTZ NOT NULL,
  arr_datetime   TIMESTAMPTZ NOT NULL,
  flight_duration TEXT,
  flight_fare    NUMERIC,
  currency_code  TEXT        NOT NULL DEFAULT 'KRW',
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS voyage_flights_voyage_id_idx ON voyage_flights (voyage_id);
CREATE INDEX IF NOT EXISTS voyage_flights_dep_datetime_idx ON voyage_flights (dep_datetime);

ALTER TABLE voyage_flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voyage_flights_select" ON voyage_flights
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "voyage_flights_insert" ON voyage_flights
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "voyage_flights_update" ON voyage_flights
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "voyage_flights_delete" ON voyage_flights
  FOR DELETE TO authenticated USING (true);

-- updated_at 자동 갱신 트리거 (voyages 테이블과 동일 패턴)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER voyage_flights_updated_at
  BEFORE UPDATE ON voyage_flights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
