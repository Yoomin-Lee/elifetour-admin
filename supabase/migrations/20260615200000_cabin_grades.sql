-- =========================================================================
-- cabin_grades: 선실 등급별 재고 관리
-- =========================================================================

CREATE TABLE cabin_grades (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  voyage_id        uuid        NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  grade            text        NOT NULL,           -- 내측 | 오션뷰 | 발코니 | 스위트 | 자유 입력
  total            int         NOT NULL DEFAULT 0, -- 보유 캐빈
  reserved         int         NOT NULL DEFAULT 0, -- 예약 캐빈
  price_per_person numeric,                        -- 1인 요금 (nullable)
  currency         text        NOT NULL DEFAULT 'KRW',
  sort_order       int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cabin_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read cabin_grades"   ON cabin_grades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write cabin_grades"  ON cabin_grades FOR INSERT  WITH CHECK (eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "update cabin_grades" ON cabin_grades FOR UPDATE
  USING     (eli_get_my_role() IN ('admin','staff'))
  WITH CHECK(eli_get_my_role() IN ('admin','staff'));
CREATE POLICY "delete cabin_grades" ON cabin_grades FOR DELETE  USING (eli_get_my_role() = 'admin');

-- =========================================================================
-- Realtime publication: 항차 관련 테이블 등록 (이미 추가된 테이블은 스킵)
-- =========================================================================
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'voyages','flights','itinerary_days','cancellation_policies',
    'history_logs','hotels','cabin_grades'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END
$$;
