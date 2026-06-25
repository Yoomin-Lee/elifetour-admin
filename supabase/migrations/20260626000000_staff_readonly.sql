-- =========================================================================
-- 직원(staff) 권한 변경: 쓰기 불가 → 열람(SELECT)만 허용
-- 관리자(admin)만 INSERT / UPDATE / DELETE 가능
-- 테이블이 없으면 해당 블록을 건너뜁니다.
-- =========================================================================

-- ── eli_trips ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='eli_trips') THEN
    DROP POLICY IF EXISTS "staff insert trips" ON eli_trips;
    DROP POLICY IF EXISTS "staff update trips" ON eli_trips;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='eli_trips' AND policyname='admin insert trips') THEN
      CREATE POLICY "admin insert trips" ON eli_trips
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='eli_trips' AND policyname='admin update trips') THEN
      CREATE POLICY "admin update trips" ON eli_trips
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── eli_passengers ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='eli_passengers') THEN
    DROP POLICY IF EXISTS "staff insert passengers" ON eli_passengers;
    DROP POLICY IF EXISTS "staff update passengers" ON eli_passengers;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='eli_passengers' AND policyname='admin insert passengers') THEN
      CREATE POLICY "admin insert passengers" ON eli_passengers
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='eli_passengers' AND policyname='admin update passengers') THEN
      CREATE POLICY "admin update passengers" ON eli_passengers
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── voyages ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='voyages') THEN
    DROP POLICY IF EXISTS "write voyages"  ON voyages;
    DROP POLICY IF EXISTS "update voyages" ON voyages;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='voyages' AND policyname='admin write voyages') THEN
      CREATE POLICY "admin write voyages" ON voyages
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='voyages' AND policyname='admin update voyages') THEN
      CREATE POLICY "admin update voyages" ON voyages
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── flights ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='flights') THEN
    DROP POLICY IF EXISTS "write flights"  ON flights;
    DROP POLICY IF EXISTS "update flights" ON flights;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='flights' AND policyname='admin write flights') THEN
      CREATE POLICY "admin write flights" ON flights
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='flights' AND policyname='admin update flights') THEN
      CREATE POLICY "admin update flights" ON flights
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── itinerary_days ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='itinerary_days') THEN
    DROP POLICY IF EXISTS "write itinerary"  ON itinerary_days;
    DROP POLICY IF EXISTS "update itinerary" ON itinerary_days;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='itinerary_days' AND policyname='admin write itinerary') THEN
      CREATE POLICY "admin write itinerary" ON itinerary_days
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='itinerary_days' AND policyname='admin update itinerary') THEN
      CREATE POLICY "admin update itinerary" ON itinerary_days
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── cancellation_policies ─────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='cancellation_policies') THEN
    DROP POLICY IF EXISTS "write cancel"  ON cancellation_policies;
    DROP POLICY IF EXISTS "update cancel" ON cancellation_policies;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='cancellation_policies' AND policyname='admin write cancel') THEN
      CREATE POLICY "admin write cancel" ON cancellation_policies
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='cancellation_policies' AND policyname='admin update cancel') THEN
      CREATE POLICY "admin update cancel" ON cancellation_policies
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── history_logs ──────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='history_logs') THEN
    DROP POLICY IF EXISTS "write history"       ON history_logs;
    DROP POLICY IF EXISTS "update history_logs" ON history_logs;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='history_logs' AND policyname='admin write history') THEN
      CREATE POLICY "admin write history" ON history_logs
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='history_logs' AND policyname='admin update history') THEN
      CREATE POLICY "admin update history" ON history_logs
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── hotels ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='hotels') THEN
    DROP POLICY IF EXISTS "write hotels"  ON hotels;
    DROP POLICY IF EXISTS "update hotels" ON hotels;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='hotels' AND policyname='admin write hotels') THEN
      CREATE POLICY "admin write hotels" ON hotels
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='hotels' AND policyname='admin update hotels') THEN
      CREATE POLICY "admin update hotels" ON hotels
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── voyage_flights ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='voyage_flights') THEN
    DROP POLICY IF EXISTS "write vflights"  ON voyage_flights;
    DROP POLICY IF EXISTS "update vflights" ON voyage_flights;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='voyage_flights' AND policyname='admin write vflights') THEN
      CREATE POLICY "admin write vflights" ON voyage_flights
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='voyage_flights' AND policyname='admin update vflights') THEN
      CREATE POLICY "admin update vflights" ON voyage_flights
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── cabin_grades ──────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='cabin_grades') THEN
    DROP POLICY IF EXISTS "write cabin_grades"  ON cabin_grades;
    DROP POLICY IF EXISTS "update cabin_grades" ON cabin_grades;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='cabin_grades' AND policyname='admin write cabin_grades') THEN
      CREATE POLICY "admin write cabin_grades" ON cabin_grades
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='cabin_grades' AND policyname='admin update cabin_grades') THEN
      CREATE POLICY "admin update cabin_grades" ON cabin_grades
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── payment_schedules ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='payment_schedules') THEN
    DROP POLICY IF EXISTS "write payment_schedules"  ON payment_schedules;
    DROP POLICY IF EXISTS "update payment_schedules" ON payment_schedules;
    DROP POLICY IF EXISTS "delete payment_schedules" ON payment_schedules;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='payment_schedules' AND policyname='admin write payment_schedules') THEN
      CREATE POLICY "admin write payment_schedules" ON payment_schedules
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='payment_schedules' AND policyname='admin update payment_schedules') THEN
      CREATE POLICY "admin update payment_schedules" ON payment_schedules
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='payment_schedules' AND policyname='admin delete payment_schedules') THEN
      CREATE POLICY "admin delete payment_schedules" ON payment_schedules
        FOR DELETE USING (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── region_options ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='region_options') THEN
    DROP POLICY IF EXISTS "write region_options"  ON region_options;
    DROP POLICY IF EXISTS "update region_options" ON region_options;
    DROP POLICY IF EXISTS "delete region_options" ON region_options;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='region_options' AND policyname='admin write region_options') THEN
      CREATE POLICY "admin write region_options" ON region_options
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='region_options' AND policyname='admin update region_options') THEN
      CREATE POLICY "admin update region_options" ON region_options
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='region_options' AND policyname='admin delete region_options') THEN
      CREATE POLICY "admin delete region_options" ON region_options
        FOR DELETE USING (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── airline_options ───────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='airline_options') THEN
    DROP POLICY IF EXISTS "write airline_options"  ON airline_options;
    DROP POLICY IF EXISTS "update airline_options" ON airline_options;
    DROP POLICY IF EXISTS "delete airline_options" ON airline_options;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='airline_options' AND policyname='admin write airline_options') THEN
      CREATE POLICY "admin write airline_options" ON airline_options
        FOR INSERT WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='airline_options' AND policyname='admin update airline_options') THEN
      CREATE POLICY "admin update airline_options" ON airline_options
        FOR UPDATE USING (eli_get_my_role() = 'admin') WITH CHECK (eli_get_my_role() = 'admin');
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='airline_options' AND policyname='admin delete airline_options') THEN
      CREATE POLICY "admin delete airline_options" ON airline_options
        FOR DELETE USING (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;

-- ── partners ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='partners') THEN
    DROP POLICY IF EXISTS "partners_insert" ON partners;
    DROP POLICY IF EXISTS "partners_update" ON partners;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='partners' AND policyname='partners_insert') THEN
      CREATE POLICY "partners_insert" ON partners
        FOR INSERT TO authenticated
        WITH CHECK (EXISTS (
          SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'
        ));
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='partners' AND policyname='partners_update') THEN
      CREATE POLICY "partners_update" ON partners
        FOR UPDATE TO authenticated
        USING (EXISTS (
          SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'
        ));
    END IF;
  END IF;
END $$;

-- ── eli_itinerary_presets ─────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='eli_itinerary_presets') THEN
    DROP POLICY IF EXISTS "presets_insert" ON eli_itinerary_presets;
    DROP POLICY IF EXISTS "presets_update" ON eli_itinerary_presets;
    DROP POLICY IF EXISTS "presets_delete" ON eli_itinerary_presets;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='eli_itinerary_presets' AND policyname='presets_insert') THEN
      CREATE POLICY "presets_insert" ON eli_itinerary_presets
        FOR INSERT TO authenticated
        WITH CHECK (EXISTS (SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='eli_itinerary_presets' AND policyname='presets_update') THEN
      CREATE POLICY "presets_update" ON eli_itinerary_presets
        FOR UPDATE TO authenticated
        USING (EXISTS (SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='eli_itinerary_presets' AND policyname='presets_delete') THEN
      CREATE POLICY "presets_delete" ON eli_itinerary_presets
        FOR DELETE TO authenticated
        USING (EXISTS (SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
  END IF;
END $$;

-- ── eli_cancellation_presets ──────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='eli_cancellation_presets') THEN
    DROP POLICY IF EXISTS "cancel_presets_insert" ON eli_cancellation_presets;
    DROP POLICY IF EXISTS "cancel_presets_update" ON eli_cancellation_presets;
    DROP POLICY IF EXISTS "cancel_presets_delete" ON eli_cancellation_presets;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='eli_cancellation_presets' AND policyname='cancel_presets_insert') THEN
      CREATE POLICY "cancel_presets_insert" ON eli_cancellation_presets
        FOR INSERT TO authenticated
        WITH CHECK (EXISTS (SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='eli_cancellation_presets' AND policyname='cancel_presets_update') THEN
      CREATE POLICY "cancel_presets_update" ON eli_cancellation_presets
        FOR UPDATE TO authenticated
        USING (EXISTS (SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='eli_cancellation_presets' AND policyname='cancel_presets_delete') THEN
      CREATE POLICY "cancel_presets_delete" ON eli_cancellation_presets
        FOR DELETE TO authenticated
        USING (EXISTS (SELECT 1 FROM eli_profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
  END IF;
END $$;

-- ── mn_sections ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='mn_sections') THEN
    DROP POLICY IF EXISTS "auth_write_mn_sections"  ON mn_sections;
    DROP POLICY IF EXISTS "admin_write_mn_sections" ON mn_sections;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='mn_sections' AND policyname='admin_write_mn_sections') THEN
      CREATE POLICY "admin_write_mn_sections" ON mn_sections
        FOR ALL USING (eli_get_my_role() = 'admin');
    END IF;
  END IF;
END $$;
