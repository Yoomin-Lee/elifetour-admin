-- '비고'(구 '호텔') 자유 텍스트 필드에 적혀있던 호텔명을 hotels 테이블로 이관.
-- 이미 hotels 테이블에 행이 있는 항차는 건드리지 않는다(NOT EXISTS 가드) —
-- 예전 엑셀 일괄 입력(04_hotels.sql) 이후 추가된 항차만 실제로 채워짐.
-- 가격이 함께 적혀있던 항차(미서부 2027-02-19)는 구간별로 행을 나누고
-- "$숫자" 표기를 요금(USD)으로 반영. "미정" 등 플레이스홀더는 이관 대상에서 제외.

INSERT INTO hotels (voyage_id, stay_date, hotel_name, room_rate, currency, sort_order)
SELECT v.id, v.departure_date, 'THE AQUARIUS CASINO RESORT', 130, 'USD', 1
FROM voyages v WHERE v.departure_date='2027-02-19' AND v.region='미서부'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'WINGATE BY WYNDHAM PAGE', 140, 'USD', 2
FROM voyages v WHERE v.departure_date='2027-02-19' AND v.region='미서부'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'PALENT HOLLYWOOD', 170, 'USD', 3
FROM voyages v WHERE v.departure_date='2027-02-19' AND v.region='미서부'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'SONESTA LOS ANGELES', 180, 'USD', 4
FROM voyages v WHERE v.departure_date='2027-02-19' AND v.region='미서부'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)

UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-12-09' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-11-28' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'CATALONIA GRAN VERDI', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-10-24' AND v.region='서부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ACTA SANT JUST BARCELONA', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-10-01' AND v.region='서부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'BEST WESTERN PREMIER BHR TREVISO HOTEL', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-08-28' AND v.region='동부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'BEST WESTERN PLUS NET TOWER HOTEL PADOVA', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-06-12' AND v.region='동부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'TOBU HOTEL LEVANT TOKYO', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-05-16' AND v.region='동북아'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'EMBASSY SUITES HILTON LYNNWOOD', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-05-16' AND v.region='알래스카'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'HOTEL ACTA SANT JUST BARCELONA', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-04-23' AND v.region='서부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-03-11' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-02-22' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-02-04' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-01-28' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2026-01-11' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-12-03' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-11-12' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-11-05' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ALOFT NOVENA', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-10-29' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ERGIFE PALACE HOTEL', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-09-03' AND v.region='서부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ERGIFE PALACE HOTEL', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-06-07' AND v.region='동부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ERGIFE PALACE HOTEL', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-05-14' AND v.region='서부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'EMBASSY SUITES HILTON LYNNWOOD', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-05-03' AND v.region='알래스카'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'YANGPU RIVERSIDE MARRIOTT', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-04-25' AND v.region='동북아'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-03-06' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-02-14' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'CONRAD SHANGHAI', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2025-02-13' AND v.region='동북아'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2024-12-09' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2024-11-20' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'BEST WESTERN PREMIER BHR TREVISO', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2024-09-27' AND v.region='동부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'EMBASSY SUITES BY HILTON LYNNWOOD', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2024-09-13' AND v.region='알래스카'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'CATALONIA GRAN HOTEL VERDI', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2024-08-31' AND v.region='서부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'FOUR POINTS BY SHERATON PADOVA', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2024-05-31' AND v.region='서부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'SB BCN EVENTS', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2024-05-11' AND v.region='서부지중해'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2024-03-06' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2024-02-25' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
UNION ALL SELECT v.id, v.departure_date, 'ORCHID', NULL, NULL, 1
FROM voyages v WHERE v.departure_date='2024-01-10' AND v.region='싱가포르'
  AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.voyage_id = v.id)
;
