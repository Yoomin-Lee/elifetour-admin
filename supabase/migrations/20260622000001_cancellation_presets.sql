-- ============================================================
-- eli_cancellation_presets — 취소료 프리셋 테이블
-- ============================================================

CREATE TABLE eli_cancellation_presets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT        NOT NULL,
  policies    JSONB       NOT NULL DEFAULT '[]',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE eli_cancellation_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cancel_presets_select" ON eli_cancellation_presets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cancel_presets_insert" ON eli_cancellation_presets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eli_profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

CREATE POLICY "cancel_presets_update" ON eli_cancellation_presets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eli_profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

CREATE POLICY "cancel_presets_delete" ON eli_cancellation_presets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eli_profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

CREATE OR REPLACE FUNCTION update_cancellation_presets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_cancellation_presets_updated_at
  BEFORE UPDATE ON eli_cancellation_presets
  FOR EACH ROW EXECUTE FUNCTION update_cancellation_presets_updated_at();

-- ── 기존 프리셋 시드 데이터 ────────────────────────────────────────────────

INSERT INTO eli_cancellation_presets (label, sort_order, policies) VALUES
(
  '크루즈 일반 (90일 기준)', 1,
  '[
    {"category":"크루즈","start_d_minus":null,"end_d_minus":91,"fee_description":"취소 무료","fee_type":"free","fee_value":null,"fee_unit":"","note":"","sort_order":1},
    {"category":"크루즈","start_d_minus":90,"end_d_minus":61,"fee_description":"크루즈요금 25%","fee_type":"percent","fee_value":25,"fee_unit":"","note":"","sort_order":2},
    {"category":"크루즈","start_d_minus":60,"end_d_minus":31,"fee_description":"크루즈요금 50%","fee_type":"percent","fee_value":50,"fee_unit":"","note":"","sort_order":3},
    {"category":"크루즈","start_d_minus":30,"end_d_minus":15,"fee_description":"크루즈요금 75%","fee_type":"percent","fee_value":75,"fee_unit":"","note":"","sort_order":4},
    {"category":"크루즈","start_d_minus":14,"end_d_minus":null,"fee_description":"크루즈요금 100%","fee_type":"percent","fee_value":100,"fee_unit":"","note":"","sort_order":5}
  ]'
),
(
  '코스타 크루즈', 2,
  '[
    {"category":"크루즈","start_d_minus":null,"end_d_minus":91,"fee_description":"취소 무료","fee_type":"free","fee_value":null,"fee_unit":"USD","note":"","sort_order":1},
    {"category":"크루즈","start_d_minus":90,"end_d_minus":30,"fee_description":"크루즈요금 25%","fee_type":"percent","fee_value":25,"fee_unit":"USD","note":"","sort_order":2},
    {"category":"크루즈","start_d_minus":29,"end_d_minus":15,"fee_description":"크루즈요금 50%","fee_type":"percent","fee_value":50,"fee_unit":"USD","note":"","sort_order":3},
    {"category":"크루즈","start_d_minus":14,"end_d_minus":8,"fee_description":"크루즈요금 75%","fee_type":"percent","fee_value":75,"fee_unit":"USD","note":"","sort_order":4},
    {"category":"크루즈","start_d_minus":7,"end_d_minus":null,"fee_description":"크루즈요금 100%","fee_type":"percent","fee_value":100,"fee_unit":"USD","note":"","sort_order":5}
  ]'
),
(
  'MSC 크루즈', 3,
  '[
    {"category":"크루즈","start_d_minus":null,"end_d_minus":121,"fee_description":"취소 무료","fee_type":"free","fee_value":null,"fee_unit":"USD","note":"","sort_order":1},
    {"category":"크루즈","start_d_minus":120,"end_d_minus":91,"fee_description":"크루즈요금 15%","fee_type":"percent","fee_value":15,"fee_unit":"USD","note":"","sort_order":2},
    {"category":"크루즈","start_d_minus":90,"end_d_minus":61,"fee_description":"크루즈요금 25%","fee_type":"percent","fee_value":25,"fee_unit":"USD","note":"","sort_order":3},
    {"category":"크루즈","start_d_minus":60,"end_d_minus":31,"fee_description":"크루즈요금 50%","fee_type":"percent","fee_value":50,"fee_unit":"USD","note":"","sort_order":4},
    {"category":"크루즈","start_d_minus":30,"end_d_minus":8,"fee_description":"크루즈요금 75%","fee_type":"percent","fee_value":75,"fee_unit":"USD","note":"","sort_order":5},
    {"category":"크루즈","start_d_minus":7,"end_d_minus":null,"fee_description":"크루즈요금 100%","fee_type":"percent","fee_value":100,"fee_unit":"USD","note":"","sort_order":6}
  ]'
),
(
  '항공 일반', 4,
  '[
    {"category":"항공","start_d_minus":null,"end_d_minus":91,"fee_description":"취소 무료","fee_type":"free","fee_value":null,"fee_unit":"KRW","note":"","sort_order":1},
    {"category":"항공","start_d_minus":90,"end_d_minus":31,"fee_description":"항공요금 10%","fee_type":"percent","fee_value":10,"fee_unit":"KRW","note":"","sort_order":2},
    {"category":"항공","start_d_minus":30,"end_d_minus":8,"fee_description":"항공요금 30%","fee_type":"percent","fee_value":30,"fee_unit":"KRW","note":"","sort_order":3},
    {"category":"항공","start_d_minus":7,"end_d_minus":null,"fee_description":"항공요금 100%","fee_type":"percent","fee_value":100,"fee_unit":"KRW","note":"","sort_order":4}
  ]'
),
(
  '크루즈 + 항공 패키지', 5,
  '[
    {"category":"크루즈","start_d_minus":null,"end_d_minus":91,"fee_description":"취소 무료","fee_type":"free","fee_value":null,"fee_unit":"","note":"","sort_order":1},
    {"category":"크루즈","start_d_minus":90,"end_d_minus":61,"fee_description":"크루즈요금 25%","fee_type":"percent","fee_value":25,"fee_unit":"","note":"","sort_order":2},
    {"category":"크루즈","start_d_minus":60,"end_d_minus":31,"fee_description":"크루즈요금 50%","fee_type":"percent","fee_value":50,"fee_unit":"","note":"","sort_order":3},
    {"category":"크루즈","start_d_minus":30,"end_d_minus":15,"fee_description":"크루즈요금 75%","fee_type":"percent","fee_value":75,"fee_unit":"","note":"","sort_order":4},
    {"category":"크루즈","start_d_minus":14,"end_d_minus":null,"fee_description":"크루즈요금 100%","fee_type":"percent","fee_value":100,"fee_unit":"","note":"","sort_order":5},
    {"category":"항공","start_d_minus":null,"end_d_minus":91,"fee_description":"취소 무료","fee_type":"free","fee_value":null,"fee_unit":"KRW","note":"","sort_order":6},
    {"category":"항공","start_d_minus":90,"end_d_minus":31,"fee_description":"항공요금 10%","fee_type":"percent","fee_value":10,"fee_unit":"KRW","note":"","sort_order":7},
    {"category":"항공","start_d_minus":30,"end_d_minus":8,"fee_description":"항공요금 30%","fee_type":"percent","fee_value":30,"fee_unit":"KRW","note":"","sort_order":8},
    {"category":"항공","start_d_minus":7,"end_d_minus":null,"fee_description":"항공요금 100%","fee_type":"percent","fee_value":100,"fee_unit":"KRW","note":"","sort_order":9}
  ]'
);
