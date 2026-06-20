-- history_logs: staff/admin이 내용 수정 가능하도록 UPDATE 정책 추가
-- (기존 설계가 append-only였으나 UI에서 편집 기능이 필요해 정책 추가)
CREATE POLICY "update history"
  ON history_logs
  FOR UPDATE
  USING (eli_get_my_role() IN ('admin', 'staff'))
  WITH CHECK (eli_get_my_role() IN ('admin', 'staff'));
