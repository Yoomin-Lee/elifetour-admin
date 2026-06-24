-- '항공사별 취소료 규정' 카테고리 추가에 따른 데이터 마이그레이션
-- KE 취소료 규정 섹션을 '취소료'에서 '항공'으로 이동
UPDATE mn_sections
SET category = '항공', updated_at = NOW()
WHERE category = '취소료'
  AND title ILIKE 'KE%'
  AND deleted_at IS NULL;
