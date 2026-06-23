-- region_options, airline_options에 usage_count 컬럼 추가
ALTER TABLE region_options  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE airline_options ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;

-- 카운트 증가 RPC 함수
CREATE OR REPLACE FUNCTION increment_region_usage(row_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE region_options SET usage_count = usage_count + 1 WHERE id = row_id;
$$;

CREATE OR REPLACE FUNCTION increment_airline_usage(row_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE airline_options SET usage_count = usage_count + 1 WHERE id = row_id;
$$;
