-- =========================================================================
-- payment_schedules: 행사별 크루즈·항공·호텔 결제 스케줄 관리
-- =========================================================================

CREATE TABLE payment_schedules (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  voyage_id     uuid        NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  category      text        NOT NULL CHECK (category IN ('CRUISE','FLIGHT','HOTEL')),
  payment_type  text        NOT NULL CHECK (payment_type IN ('DEPOSIT_1ST','DEPOSIT_2ND','BALANCE')),
  amount        numeric     NOT NULL DEFAULT 0,
  currency      text        NOT NULL DEFAULT 'KRW',
  due_date      date        NOT NULL,
  is_completed  boolean     NOT NULL DEFAULT false,
  memo          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (voyage_id, category, payment_type)
);

ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read payment_schedules"
  ON payment_schedules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "write payment_schedules"
  ON payment_schedules FOR INSERT
  WITH CHECK (eli_get_my_role() IN ('admin','staff'));

CREATE POLICY "update payment_schedules"
  ON payment_schedules FOR UPDATE
  USING     (eli_get_my_role() IN ('admin','staff'))
  WITH CHECK(eli_get_my_role() IN ('admin','staff'));

CREATE POLICY "delete payment_schedules"
  ON payment_schedules FOR DELETE
  USING (eli_get_my_role() IN ('admin','staff'));

-- =========================================================================
-- Realtime publication
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'payment_schedules'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_schedules;
  END IF;
END
$$;
