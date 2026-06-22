-- ============================================================
-- eli_itinerary_presets — 기항지 루트 프리셋 테이블
-- ============================================================

CREATE TABLE eli_itinerary_presets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT        NOT NULL,
  nights      INTEGER,
  ports       JSONB       NOT NULL DEFAULT '[]',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE eli_itinerary_presets ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자 전체 읽기 허용
CREATE POLICY "presets_select" ON eli_itinerary_presets
  FOR SELECT TO authenticated USING (true);

-- staff / admin 쓰기 허용
CREATE POLICY "presets_insert" ON eli_itinerary_presets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eli_profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

CREATE POLICY "presets_update" ON eli_itinerary_presets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eli_profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

CREATE POLICY "presets_delete" ON eli_itinerary_presets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eli_profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_itinerary_presets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_itinerary_presets_updated_at
  BEFORE UPDATE ON eli_itinerary_presets
  FOR EACH ROW EXECUTE FUNCTION update_itinerary_presets_updated_at();

-- ── 기존 프리셋 시드 데이터 ────────────────────────────────────────────────

INSERT INTO eli_itinerary_presets (label, nights, sort_order, ports) VALUES
(
  '싱가포르 5박6일 (싱가포르 왕복)', 5, 1,
  '[
    {"port":"싱가포르","arrival_time":"14:25","departure_time":"","summary":"도착"},
    {"port":"싱가포르","arrival_time":"","departure_time":"16:00","summary":"크루즈 승선"},
    {"port":"페낭","arrival_time":"14:30","departure_time":"21:00","summary":""},
    {"port":"푸켓","arrival_time":"08:00","departure_time":"20:00","summary":""},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"싱가포르","arrival_time":"07:00","departure_time":"","summary":"하선·귀국"}
  ]'
),
(
  '동북아 6박7일 (상해 왕복)', 6, 2,
  '[
    {"port":"상해","arrival_time":"","departure_time":"","summary":"도착"},
    {"port":"상해","arrival_time":"","departure_time":"16:30","summary":"크루즈 승선"},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"나가사키","arrival_time":"07:00","departure_time":"19:00","summary":""},
    {"port":"가고시마","arrival_time":"08:00","departure_time":"19:00","summary":""},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"상해","arrival_time":"07:00","departure_time":"","summary":"하선·귀국"}
  ]'
),
(
  '동북아 6박 (도쿄 왕복)', 6, 3,
  '[
    {"port":"도쿄 (일본)","arrival_time":"10:50","departure_time":"","summary":"도착"},
    {"port":"도쿄 (일본)","arrival_time":"","departure_time":"16:00","summary":"크루즈 승선"},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"제주 (한국)","arrival_time":"12:30","departure_time":"21:00","summary":""},
    {"port":"가고시마 (일본)","arrival_time":"13:00","departure_time":"21:00","summary":""},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"도쿄 (일본)","arrival_time":"08:00","departure_time":"12:50","summary":"하선·귀국"}
  ]'
),
(
  '동북아 6박 (홍콩 왕복)', 6, 4,
  '[
    {"port":"홍콩 (홍콩)","arrival_time":"12:00","departure_time":"","summary":"도착"},
    {"port":"홍콩 (홍콩)","arrival_time":"","departure_time":"16:00","summary":"크루즈 승선"},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"오키나와 (일본)","arrival_time":"11:30","departure_time":"20:00","summary":""},
    {"port":"기륭 (대만)","arrival_time":"13:00","departure_time":"23:00","summary":""},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"홍콩 (홍콩)","arrival_time":"06:30","departure_time":"13:10","summary":"하선·귀국"}
  ]'
),
(
  '알래스카 8박9일 (시애틀 왕복)', 8, 5,
  '[
    {"port":"시애틀","arrival_time":"","departure_time":"","summary":"도착"},
    {"port":"시애틀","arrival_time":"","departure_time":"16:00","summary":"크루즈 승선"},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"싯카","arrival_time":"09:30","departure_time":"17:00","summary":""},
    {"port":"스캐그웨이","arrival_time":"07:00","departure_time":"20:00","summary":""},
    {"port":"주노","arrival_time":"07:00","departure_time":"17:00","summary":""},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"빅토리아","arrival_time":"15:00","departure_time":"22:00","summary":""},
    {"port":"시애틀","arrival_time":"06:00","departure_time":"","summary":"하선·귀국"}
  ]'
),
(
  '미서부 8박9일 (LA 왕복)', 8, 6,
  '[
    {"port":"LA","arrival_time":"","departure_time":"","summary":"도착"},
    {"port":"페이지","arrival_time":"","departure_time":"","summary":""},
    {"port":"라스베가스","arrival_time":"","departure_time":"","summary":""},
    {"port":"LA","arrival_time":"","departure_time":"16:00","summary":"크루즈 승선"},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"카탈리나","arrival_time":"07:00","departure_time":"18:00","summary":""},
    {"port":"앤세나다","arrival_time":"08:00","departure_time":"17:00","summary":""},
    {"port":"LA","arrival_time":"07:00","departure_time":"","summary":"하선"},
    {"port":"LA","arrival_time":"","departure_time":"","summary":"귀국"}
  ]'
),
(
  '아라비아반도 7박 (두바이 왕복)', 7, 7,
  '[
    {"port":"두바이 (아랍에미리트)","arrival_time":"","departure_time":"","summary":"도착"},
    {"port":"두바이 (아랍에미리트)","arrival_time":"","departure_time":"","summary":""},
    {"port":"두바이 (아랍에미리트)","arrival_time":"","departure_time":"13:00","summary":"크루즈 승선"},
    {"port":"무스카트 (오만)","arrival_time":"08:30","departure_time":"19:00","summary":""},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"도하 (카타르)","arrival_time":"07:00","departure_time":"18:00","summary":""},
    {"port":"아부다비 (아랍에미리트)","arrival_time":"07:30","departure_time":"22:00","summary":""},
    {"port":"두바이 (아랍에미리트)","arrival_time":"07:00","departure_time":"","summary":"하선·귀국"}
  ]'
),
(
  '서부지중해 8박9일 (바르셀로나 왕복)', 8, 8,
  '[
    {"port":"바르셀로나","arrival_time":"19:10","departure_time":"","summary":"도착"},
    {"port":"바르셀로나","arrival_time":"","departure_time":"18:00","summary":"크루즈 승선"},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"칼리아리","arrival_time":"07:00","departure_time":"16:00","summary":"사르데냐"},
    {"port":"나폴리","arrival_time":"09:00","departure_time":"19:00","summary":""},
    {"port":"로마","arrival_time":"08:00","departure_time":"19:00","summary":"치비타베키아"},
    {"port":"제노바","arrival_time":"08:30","departure_time":"18:00","summary":""},
    {"port":"마르세유","arrival_time":"09:00","departure_time":"18:00","summary":""},
    {"port":"바르셀로나","arrival_time":"08:00","departure_time":"19:35","summary":"하선·귀국"}
  ]'
),
(
  '동부지중해 8박 (베니스 왕복)', 8, 9,
  '[
    {"port":"베니스 (이탈리아)","arrival_time":"19:00","departure_time":"","summary":"도착"},
    {"port":"베니스 (이탈리아)","arrival_time":"","departure_time":"17:00","summary":"크루즈 승선"},
    {"port":"바리 (이탈리아)","arrival_time":"14:00","departure_time":"20:00","summary":"알베로벨로"},
    {"port":"코르푸 (그리스)","arrival_time":"09:00","departure_time":"19:00","summary":"팔레오카스트릿차"},
    {"port":"아르고스톨리 (그리스)","arrival_time":"07:30","departure_time":"15:30","summary":"멜리사니 동굴"},
    {"port":"두브로브니크 (크로아티아)","arrival_time":"10:00","departure_time":"20:00","summary":"성벽투어"},
    {"port":"코토르 (몬테네그로)","arrival_time":"08:00","departure_time":"18:00","summary":"페라스트"},
    {"port":"자다르 (크로아티아)","arrival_time":"12:00","departure_time":"20:00","summary":"크르카 국립공원"},
    {"port":"베니스 (이탈리아)","arrival_time":"08:00","departure_time":"","summary":"하선·귀국"}
  ]'
),
(
  '북유럽 8박 (로테르담 왕복)', 8, 10,
  '[
    {"port":"로테르담 (네덜란드)","arrival_time":"","departure_time":"","summary":"도착"},
    {"port":"로테르담 (네덜란드)","arrival_time":"","departure_time":"15:00","summary":"크루즈 승선"},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"오다 (노르웨이)","arrival_time":"07:00","departure_time":"16:00","summary":""},
    {"port":"올레순 (노르웨이)","arrival_time":"11:00","departure_time":"23:00","summary":""},
    {"port":"올덴 (노르웨이)","arrival_time":"08:00","departure_time":"18:00","summary":""},
    {"port":"베르겐 (노르웨이)","arrival_time":"08:00","departure_time":"17:00","summary":""},
    {"port":"해상","arrival_time":"","departure_time":"","summary":""},
    {"port":"로테르담 (네덜란드)","arrival_time":"07:00","departure_time":"","summary":"하선·귀국"}
  ]'
);
