-- 복제된 중복 행사 삭제: 27/10/16 동부 지중해
-- created_at 기준으로 가장 최근에 생성된 복제본 1건만 삭제
DELETE FROM voyages
WHERE id = (
  SELECT id FROM voyages
  WHERE departure_date = '2027-10-16'
    AND region LIKE '%동부 지중해%'
  ORDER BY created_at DESC
  LIMIT 1
);
