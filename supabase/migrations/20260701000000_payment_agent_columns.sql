-- =========================================================================
-- payment_schedules: agent_id 컬럼 추가 + voyages: payment_col_order 추가
-- 에이전트별 결제 조건 분리 및 열 순서 팀 공유 저장
-- =========================================================================

-- 1. payment_schedules 에 agent_id 추가
ALTER TABLE payment_schedules
  ADD COLUMN IF NOT EXISTS agent_id text NOT NULL DEFAULT 'default';

-- 2. 기존 유니크 제약 제거 → agent_id 포함으로 교체
ALTER TABLE payment_schedules
  DROP CONSTRAINT IF EXISTS payment_schedules_voyage_id_category_payment_type_section_key;

ALTER TABLE payment_schedules
  ADD CONSTRAINT payment_schedules_voyage_category_pt_section_agent_key
  UNIQUE (voyage_id, category, payment_type, section, agent_id);

-- 3. voyages 에 열 순서/구성 저장용 JSONB 컬럼 추가
ALTER TABLE voyages
  ADD COLUMN IF NOT EXISTS payment_col_order jsonb;

-- =========================================================================
-- RPC: 에이전트 열 원자적 삭제
-- payment_schedules 행 삭제 + voyages.payment_col_order 갱신을 단일 트랜잭션으로
-- =========================================================================
CREATE OR REPLACE FUNCTION delete_payment_agent_column(
  p_voyage_id  uuid,
  p_agent_id   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 기본(default) 열은 삭제 불가
  IF p_agent_id = 'default' THEN
    RAISE EXCEPTION 'default 열은 삭제할 수 없습니다';
  END IF;

  -- payment_schedules 해당 agent_id 행 전부 삭제
  DELETE FROM payment_schedules
  WHERE voyage_id = p_voyage_id
    AND agent_id  = p_agent_id;

  -- payment_col_order 배열에서 해당 agentId 항목 제거
  UPDATE voyages
  SET payment_col_order = (
    SELECT COALESCE(jsonb_agg(el ORDER BY ord), '[]'::jsonb)
    FROM jsonb_array_elements(
      COALESCE(payment_col_order, '[]'::jsonb)
    ) WITH ORDINALITY AS t(el, ord)
    WHERE el->>'agentId' != p_agent_id
  )
  WHERE id = p_voyage_id;
END;
$$;

-- 실행 권한: 인증된 사용자(staff/admin) 에게 부여
GRANT EXECUTE ON FUNCTION delete_payment_agent_column(uuid, text)
  TO authenticated;
