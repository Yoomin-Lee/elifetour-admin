-- =========================================================================
-- RLS 강화: 항차 관련 테이블을 eli_trips 패턴으로 통일
-- escort = 읽기 전용, staff = 읽기+쓰기, admin = 전체(삭제 포함)
-- =========================================================================

-- ── voyages ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff voyages" ON voyages;

CREATE POLICY "read voyages"   ON voyages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write voyages"  ON voyages FOR INSERT WITH CHECK (eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "update voyages" ON voyages FOR UPDATE
  USING     (eli_get_my_role() IN ('admin','staff'))
  WITH CHECK(eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "delete voyages" ON voyages FOR DELETE USING (eli_get_my_role() = 'admin');

-- ── flights ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff flights" ON flights;

CREATE POLICY "read flights"   ON flights FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write flights"  ON flights FOR INSERT WITH CHECK (eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "update flights" ON flights FOR UPDATE
  USING     (eli_get_my_role() IN ('admin','staff'))
  WITH CHECK(eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "delete flights" ON flights FOR DELETE USING (eli_get_my_role() = 'admin');

-- ── itinerary_days ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff itinerary" ON itinerary_days;

CREATE POLICY "read itinerary"   ON itinerary_days FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write itinerary"  ON itinerary_days FOR INSERT WITH CHECK (eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "update itinerary" ON itinerary_days FOR UPDATE
  USING     (eli_get_my_role() IN ('admin','staff'))
  WITH CHECK(eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "delete itinerary" ON itinerary_days FOR DELETE USING (eli_get_my_role() = 'admin');

-- ── cancellation_policies ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff cancel" ON cancellation_policies;

CREATE POLICY "read cancel"   ON cancellation_policies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write cancel"  ON cancellation_policies FOR INSERT WITH CHECK (eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "update cancel" ON cancellation_policies FOR UPDATE
  USING     (eli_get_my_role() IN ('admin','staff'))
  WITH CHECK(eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "delete cancel" ON cancellation_policies FOR DELETE USING (eli_get_my_role() = 'admin');

-- ── history_logs (append-only: UPDATE 없음, DELETE는 admin만) ─────────────
DROP POLICY IF EXISTS "staff history" ON history_logs;

CREATE POLICY "read history"   ON history_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write history"  ON history_logs FOR INSERT WITH CHECK (eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "delete history" ON history_logs FOR DELETE USING (eli_get_my_role() = 'admin');
-- UPDATE 정책 없음 → 기록 수정 불가

-- ── hotels ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "hotels_auth_select" ON hotels;
DROP POLICY IF EXISTS "hotels_auth_insert" ON hotels;
DROP POLICY IF EXISTS "hotels_auth_update" ON hotels;
DROP POLICY IF EXISTS "hotels_auth_delete" ON hotels;

CREATE POLICY "read hotels"   ON hotels FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write hotels"  ON hotels FOR INSERT WITH CHECK (eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "update hotels" ON hotels FOR UPDATE
  USING     (eli_get_my_role() IN ('admin','staff'))
  WITH CHECK(eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "delete hotels" ON hotels FOR DELETE USING (eli_get_my_role() = 'admin');

-- ── voyage_flights ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "voyage_flights_select" ON voyage_flights;
DROP POLICY IF EXISTS "voyage_flights_insert" ON voyage_flights;
DROP POLICY IF EXISTS "voyage_flights_update" ON voyage_flights;
DROP POLICY IF EXISTS "voyage_flights_delete" ON voyage_flights;

CREATE POLICY "read vflights"   ON voyage_flights FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write vflights"  ON voyage_flights FOR INSERT WITH CHECK (eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "update vflights" ON voyage_flights FOR UPDATE
  USING     (eli_get_my_role() IN ('admin','staff'))
  WITH CHECK(eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "delete vflights" ON voyage_flights FOR DELETE USING (eli_get_my_role() = 'admin');
