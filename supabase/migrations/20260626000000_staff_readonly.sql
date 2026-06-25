-- =========================================================================
-- 직원(staff) 권한 변경: 쓰기 불가 → 열람(SELECT)만 허용
-- 관리자(admin)만 INSERT / UPDATE / DELETE 가능
-- =========================================================================

-- ── eli_trips ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff insert trips" ON eli_trips;
DROP POLICY IF EXISTS "staff update trips" ON eli_trips;
CREATE POLICY "admin insert trips" ON eli_trips
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update trips" ON eli_trips
  FOR UPDATE USING  (eli_get_my_role() = 'admin')
             WITH CHECK (eli_get_my_role() = 'admin');

-- ── eli_passengers ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff insert passengers" ON eli_passengers;
DROP POLICY IF EXISTS "staff update passengers" ON eli_passengers;
CREATE POLICY "admin insert passengers" ON eli_passengers
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update passengers" ON eli_passengers
  FOR UPDATE USING  (eli_get_my_role() = 'admin')
             WITH CHECK (eli_get_my_role() = 'admin');

-- ── voyages ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "write voyages"  ON voyages;
DROP POLICY IF EXISTS "update voyages" ON voyages;
CREATE POLICY "admin write voyages"  ON voyages
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update voyages" ON voyages
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');

-- ── flights ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "write flights"  ON flights;
DROP POLICY IF EXISTS "update flights" ON flights;
CREATE POLICY "admin write flights"  ON flights
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update flights" ON flights
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');

-- ── itinerary_days ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "write itinerary"  ON itinerary_days;
DROP POLICY IF EXISTS "update itinerary" ON itinerary_days;
CREATE POLICY "admin write itinerary"  ON itinerary_days
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update itinerary" ON itinerary_days
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');

-- ── cancellation_policies ────────────────────────────────────────────────
DROP POLICY IF EXISTS "write cancel"  ON cancellation_policies;
DROP POLICY IF EXISTS "update cancel" ON cancellation_policies;
CREATE POLICY "admin write cancel"  ON cancellation_policies
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update cancel" ON cancellation_policies
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');

-- ── history_logs ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "write history"         ON history_logs;
DROP POLICY IF EXISTS "update history_logs"   ON history_logs;
CREATE POLICY "admin write history" ON history_logs
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update history" ON history_logs
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');

-- ── hotels ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "write hotels"  ON hotels;
DROP POLICY IF EXISTS "update hotels" ON hotels;
CREATE POLICY "admin write hotels"  ON hotels
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update hotels" ON hotels
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');

-- ── voyage_flights ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "write vflights"  ON voyage_flights;
DROP POLICY IF EXISTS "update vflights" ON voyage_flights;
CREATE POLICY "admin write vflights"  ON voyage_flights
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update vflights" ON voyage_flights
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');

-- ── cabin_grades ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "write cabin_grades"  ON cabin_grades;
DROP POLICY IF EXISTS "update cabin_grades" ON cabin_grades;
CREATE POLICY "admin write cabin_grades"  ON cabin_grades
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update cabin_grades" ON cabin_grades
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');

-- ── payment_schedules ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "write payment_schedules"  ON payment_schedules;
DROP POLICY IF EXISTS "update payment_schedules" ON payment_schedules;
DROP POLICY IF EXISTS "delete payment_schedules" ON payment_schedules;
CREATE POLICY "admin write payment_schedules" ON payment_schedules
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update payment_schedules" ON payment_schedules
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');
CREATE POLICY "admin delete payment_schedules" ON payment_schedules
  FOR DELETE USING     (eli_get_my_role() = 'admin');

-- ── region_options ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "write region_options"  ON region_options;
DROP POLICY IF EXISTS "update region_options" ON region_options;
DROP POLICY IF EXISTS "delete region_options" ON region_options;
CREATE POLICY "admin write region_options"  ON region_options
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update region_options" ON region_options
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');
CREATE POLICY "admin delete region_options" ON region_options
  FOR DELETE USING     (eli_get_my_role() = 'admin');

-- ── airline_options ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "write airline_options"  ON airline_options;
DROP POLICY IF EXISTS "update airline_options" ON airline_options;
DROP POLICY IF EXISTS "delete airline_options" ON airline_options;
CREATE POLICY "admin write airline_options"  ON airline_options
  FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
CREATE POLICY "admin update airline_options" ON airline_options
  FOR UPDATE USING     (eli_get_my_role() = 'admin')
             WITH CHECK(eli_get_my_role() = 'admin');
CREATE POLICY "admin delete airline_options" ON airline_options
  FOR DELETE USING     (eli_get_my_role() = 'admin');

-- ── partners ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "partners_insert" ON partners;
DROP POLICY IF EXISTS "partners_update" ON partners;
CREATE POLICY "partners_insert" ON partners
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "partners_update" ON partners
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ── eli_itinerary_presets ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "presets_insert" ON eli_itinerary_presets;
DROP POLICY IF EXISTS "presets_update" ON eli_itinerary_presets;
DROP POLICY IF EXISTS "presets_delete" ON eli_itinerary_presets;
CREATE POLICY "presets_insert" ON eli_itinerary_presets
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "presets_update" ON eli_itinerary_presets
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "presets_delete" ON eli_itinerary_presets
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ── eli_cancellation_presets ─────────────────────────────────────────────
DROP POLICY IF EXISTS "cancel_presets_insert" ON eli_cancellation_presets;
DROP POLICY IF EXISTS "cancel_presets_update" ON eli_cancellation_presets;
DROP POLICY IF EXISTS "cancel_presets_delete" ON eli_cancellation_presets;
CREATE POLICY "cancel_presets_insert" ON eli_cancellation_presets
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "cancel_presets_update" ON eli_cancellation_presets
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "cancel_presets_delete" ON eli_cancellation_presets
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ── mn_sections ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_write_mn_sections" ON mn_sections;
CREATE POLICY "admin_write_mn_sections" ON mn_sections
  FOR ALL USING (eli_get_my_role() = 'admin');
