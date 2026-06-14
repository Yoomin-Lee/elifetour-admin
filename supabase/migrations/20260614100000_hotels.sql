-- 호텔 정보 테이블
CREATE TABLE IF NOT EXISTS hotels (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id   uuid NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  stay_date   date NOT NULL,
  hotel_name  text NOT NULL DEFAULT '',
  room_rate   numeric(10,2),
  currency    text DEFAULT 'USD',
  sort_order  int  DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hotels_auth_select" ON hotels FOR SELECT TO authenticated USING (true);
CREATE POLICY "hotels_auth_insert" ON hotels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "hotels_auth_update" ON hotels FOR UPDATE TO authenticated USING (true);
CREATE POLICY "hotels_auth_delete" ON hotels FOR DELETE TO authenticated USING (true);

-- 기항지 일정: 비용 통화 컬럼 추가
ALTER TABLE itinerary_days
  ADD COLUMN IF NOT EXISTS cost_currency text DEFAULT 'USD';
