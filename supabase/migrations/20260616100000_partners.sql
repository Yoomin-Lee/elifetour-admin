-- 협력업체(랜드사/크루즈사/항공사/호텔/버스/가이드) 마스터 테이블
CREATE TABLE IF NOT EXISTS partners (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text        NOT NULL CHECK (type IN ('LAND','CRUISE','AIRLINE','HOTEL','BUS','GUIDE','OTHER')),
  name          text        NOT NULL,
  country       text,
  region        text,
  contact_name  text,
  contact_email text,
  contact_phone text,
  website       text,
  memo          text,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_type      ON partners (type);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners (is_active);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners_select" ON partners
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "partners_insert" ON partners
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eli_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "partners_update" ON partners
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eli_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "partners_delete" ON partners
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eli_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
