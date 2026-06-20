-- mn_sections: 외부 참조 링크 컬럼 추가
ALTER TABLE mn_sections
  ADD COLUMN IF NOT EXISTS reference_url text;
