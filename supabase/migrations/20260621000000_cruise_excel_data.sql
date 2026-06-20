-- ============================================================
-- 엑셀 크루즈 데이터 일괄 입력
-- 에이전트 / 캐빈등급 / 캐빈가 업데이트
-- ============================================================
-- 실행 방법: Supabase SQL Editor에서 전체 복붙 후 실행
-- 매칭 기준: departure_date + region ILIKE 키워드
-- ============================================================

-- ── Step 1: 항차 에이전트 업데이트 ──────────────────────────────────────

WITH updates(dep, region_kw, new_agent) AS (VALUES
  ('2025-02-14'::date, '동북아',   'TMK'),
  ('2025-02-15'::date, '싱가포르', 'FLORENCE'),
  ('2025-02-22'::date, '두바이',   'COSTA'),
  ('2025-03-07'::date, '싱가포르', 'TMK'),
  ('2025-04-07'::date, '미서부',   'TMK'),
  ('2025-04-26'::date, '동북아',   'TMK'),
  ('2025-05-04'::date, '알래스카', 'DONGBO'),
  ('2025-05-15'::date, '서부지중해','TMK'),
  ('2025-06-08'::date, '동부지중해','TMK'),
  ('2025-09-04'::date, '서부지중해','TMK'),
  ('2025-09-15'::date, '알래스카', 'TMK'),
  ('2025-09-28'::date, '동부지중해','TMK'),
  ('2025-10-23'::date, '싱가포르', 'ONLINE'),
  ('2025-10-30'::date, '싱가포르', 'TMK'),
  ('2025-11-06'::date, '싱가포르', 'TMK'),
  ('2025-11-09'::date, '카리브해', 'TMK'),
  ('2025-11-13'::date, '싱가포르', 'ONLINE'),
  ('2025-12-04'::date, '싱가포르', 'TMK'),
  ('2026-01-12'::date, '싱가포르', 'TMK'),
  ('2026-01-17'::date, '두바이',   'COSTA'),
  ('2026-01-29'::date, '싱가포르', 'TMK'),
  ('2026-02-05'::date, '싱가포르', 'TMK'),
  ('2026-02-06'::date, '호주',     'TMK'),
  ('2026-02-23'::date, '싱가포르', 'ONLINE'),
  ('2026-03-02'::date, '미서부',   'TMK'),
  ('2026-03-12'::date, '싱가포르', 'ONLINE'),
  ('2026-04-10'::date, '서부지중해','COSTA'),
  ('2026-04-24'::date, '서부지중해','VASCO'),
  ('2026-05-17'::date, '동북아',   'VASCO'),
  ('2026-05-17'::date, '알래스카', 'DONGBO'),
  ('2026-06-05'::date, '동부지중해','VASCO'),
  ('2026-06-13'::date, '동부지중해','COSTA'),
  ('2026-08-09'::date, '북유럽',   'DONGBO'),
  ('2026-08-29'::date, '동부지중해','COSTA'),
  ('2026-08-31'::date, '알래스카', 'TMK'),
  ('2026-09-21'::date, '알래스카', 'VASCO'),
  ('2026-10-02'::date, '서부지중해','VASCO'),
  ('2026-10-17'::date, '개기일식', 'DONGBO'),
  ('2026-10-25'::date, '서부지중해','COSTA'),
  ('2026-11-29'::date, '싱가포르', 'TMK'),
  ('2026-12-10'::date, '싱가포르', 'ONLINE'),
  ('2027-01-03'::date, '홍콩',     'TMK'),
  ('2027-01-09'::date, '두바이',   'COSTA'),
  ('2027-01-28'::date, '싱가포르', 'TMK'),
  ('2027-02-14'::date, '동북아',   'TMK'),
  ('2027-02-22'::date, '미서부',   'TMK'),
  ('2027-03-09'::date, '싱가포르', 'TMK'),
  ('2027-03-13'::date, '싱가포르', 'ONLINE'),
  ('2027-04-18'::date, '동북아',   'TMK'),
  ('2027-04-18'::date, '동부지중해','COSTA'),
  ('2027-05-08'::date, '서부지중해','VASCO'),
  ('2027-05-16'::date, '알래스카', 'DONGBO'),
  ('2027-08-15'::date, '알래스카', 'DONGBO'),
  ('2027-09-11'::date, '서부지중해','VASCO'),
  ('2027-10-17'::date, '동부지중해','COSTA')
)
UPDATE voyages SET agent = u.new_agent
FROM updates u
WHERE voyages.departure_date = u.dep
  AND voyages.region ILIKE '%' || u.region_kw || '%'
  AND u.new_agent <> '';


-- ── Step 2: 기존 캐빈등급 삭제 (재입력 대상 항차) ─────────────────────────

DELETE FROM cabin_grades
WHERE voyage_id IN (
  SELECT DISTINCT v.id FROM voyages v
  WHERE
    (v.departure_date = '2025-02-14' AND v.region ILIKE '%동북아%')
    OR (v.departure_date = '2025-02-15' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2025-02-22' AND v.region ILIKE '%두바이%')
    OR (v.departure_date = '2025-03-07' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2025-04-07' AND v.region ILIKE '%미서부%')
    OR (v.departure_date = '2025-04-26' AND v.region ILIKE '%동북아%')
    OR (v.departure_date = '2025-05-04' AND v.region ILIKE '%알래스카%')
    OR (v.departure_date = '2025-05-15' AND v.region ILIKE '%서부지중해%')
    OR (v.departure_date = '2025-06-08' AND v.region ILIKE '%동부지중해%')
    OR (v.departure_date = '2025-09-04' AND v.region ILIKE '%서부지중해%')
    OR (v.departure_date = '2025-09-15' AND v.region ILIKE '%알래스카%')
    OR (v.departure_date = '2025-09-28' AND v.region ILIKE '%동부지중해%')
    OR (v.departure_date = '2025-10-23' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2025-10-30' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2025-11-06' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2025-11-09' AND v.region ILIKE '%카리브해%')
    OR (v.departure_date = '2025-11-13' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2025-12-04' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2026-01-12' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2026-01-17' AND v.region ILIKE '%두바이%')
    OR (v.departure_date = '2026-01-29' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2026-02-05' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2026-02-06' AND v.region ILIKE '%호주%')
    OR (v.departure_date = '2026-02-23' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2026-03-02' AND v.region ILIKE '%미서부%')
    OR (v.departure_date = '2026-03-12' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2026-04-10' AND v.region ILIKE '%서부지중해%')
    OR (v.departure_date = '2026-04-24' AND v.region ILIKE '%서부지중해%')
    OR (v.departure_date = '2026-05-17' AND v.region ILIKE '%동북아%')
    OR (v.departure_date = '2026-05-17' AND v.region ILIKE '%알래스카%')
    OR (v.departure_date = '2026-06-05' AND v.region ILIKE '%동부지중해%')
    OR (v.departure_date = '2026-06-13' AND v.region ILIKE '%동부지중해%')
    OR (v.departure_date = '2026-08-09' AND v.region ILIKE '%북유럽%')
    OR (v.departure_date = '2026-08-29' AND v.region ILIKE '%동부지중해%')
    OR (v.departure_date = '2026-08-31' AND v.region ILIKE '%알래스카%')
    OR (v.departure_date = '2026-09-18' AND v.region ILIKE '%동부지중해%')
    OR (v.departure_date = '2026-09-21' AND v.region ILIKE '%알래스카%')
    OR (v.departure_date = '2026-10-02' AND v.region ILIKE '%서부지중해%')
    OR (v.departure_date = '2026-10-17' AND v.region ILIKE '%개기일식%')
    OR (v.departure_date = '2026-10-25' AND v.region ILIKE '%서부지중해%')
    OR (v.departure_date = '2026-11-29' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2026-12-10' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2027-01-03' AND v.region ILIKE '%홍콩%')
    OR (v.departure_date = '2027-01-09' AND v.region ILIKE '%두바이%')
    OR (v.departure_date = '2027-01-28' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2027-02-14' AND v.region ILIKE '%동북아%')
    OR (v.departure_date = '2027-02-22' AND v.region ILIKE '%미서부%')
    OR (v.departure_date = '2027-03-09' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2027-03-13' AND v.region ILIKE '%싱가포르%')
    OR (v.departure_date = '2027-04-18' AND v.region ILIKE '%동북아%')
    OR (v.departure_date = '2027-04-18' AND v.region ILIKE '%동부지중해%')
    OR (v.departure_date = '2027-05-08' AND v.region ILIKE '%서부지중해%')
    OR (v.departure_date = '2027-05-16' AND v.region ILIKE '%알래스카%')
    OR (v.departure_date = '2027-08-15' AND v.region ILIKE '%알래스카%')
    OR (v.departure_date = '2027-09-11' AND v.region ILIKE '%서부지중해%')
    OR (v.departure_date = '2027-10-17' AND v.region ILIKE '%동부지중해%')
);


-- ── Step 3: 캐빈등급 신규 입력 ─────────────────────────────────────────────
-- 통화 기준: 지중해·북유럽·두바이 → EUR / 그 외 → USD
-- 등급 없는 항목: '기본' 으로 저장

INSERT INTO cabin_grades (voyage_id, grade, total, reserved, price_per_person, currency, sort_order)
SELECT v.id, d.grade, d.total, d.reserved, d.price, d.currency, d.sort_order
FROM voyages v
JOIN (VALUES
  -- dep, region_kw, grade, total, reserved, price, currency, sort_order
  ('2025-02-14'::date,'동북아',   '4D',       11, 11, 989::numeric,     'USD', 0),
  ('2025-02-15'::date,'싱가포르', '4D',       32, 32, NULL::numeric,    'USD', 0),
  ('2025-02-22'::date,'두바이',   '기본',     23, 23, 919::numeric,     'EUR', 0),
  ('2025-03-07'::date,'싱가포르', '1D',        9,  9, 710.15::numeric,  'USD', 0),
  ('2025-03-07'::date,'싱가포르', '4D',        8,  8, 708.15::numeric,  'USD', 1),
  ('2025-03-07'::date,'싱가포르', '4U',        1,  1, 578.15::numeric,  'USD', 2),
  ('2025-04-07'::date,'미서부',   '2D',        6,  6, 967.72::numeric,  'USD', 0),
  ('2025-04-26'::date,'동북아',   '4D',       16, 16, 865.5::numeric,   'USD', 0),
  ('2025-05-04'::date,'알래스카', 'VD',       18, 18, 1924::numeric,    'USD', 0),
  ('2025-05-15'::date,'서부지중해','1D',        2,  2, 1824.69::numeric, 'EUR', 0),
  ('2025-05-15'::date,'서부지중해','3D',        1,  1, 1824.69::numeric, 'EUR', 1),
  ('2025-05-15'::date,'서부지중해','4D',        7,  7, 1824.69::numeric, 'EUR', 2),
  ('2025-06-08'::date,'동부지중해','4D',       16, 16, 1791.54::numeric, 'EUR', 0),
  ('2025-06-08'::date,'동부지중해','3D(FIT)',   1,  1, 2027.65::numeric, 'EUR', 1),
  ('2025-09-04'::date,'서부지중해','4D',       14, 14, 1899.95::numeric, 'EUR', 0),
  ('2025-09-15'::date,'알래스카', '4D',       16,  0, 1397.38::numeric, 'USD', 0),
  ('2025-09-28'::date,'동부지중해','2D',       22,  0, 1815.4::numeric,  'EUR', 0),
  ('2025-09-28'::date,'동부지중해','4D',       10,  0, 1768.4::numeric,  'EUR', 1),
  ('2025-10-23'::date,'싱가포르', '4D',       13, 13, 768.5::numeric,   'USD', 0),
  ('2025-10-30'::date,'싱가포르', '2D',       12, 12, 729.65::numeric,  'USD', 0),
  ('2025-10-30'::date,'싱가포르', '4U',        1,  1, 550.65::numeric,  'USD', 1),
  ('2025-11-06'::date,'싱가포르', '2D',       23, 23, 698.5::numeric,   'USD', 0),
  ('2025-11-06'::date,'싱가포르', '3D(FIT)',   1,  1, 762.98::numeric,  'USD', 1),
  ('2025-11-09'::date,'카리브해', '4D',       16,  0, 1126.77::numeric, 'USD', 0),
  ('2025-11-13'::date,'싱가포르', '4D',       16, 16, 768.5::numeric,   'USD', 0),
  ('2025-12-04'::date,'싱가포르', '2D',        4,  4, 816.5::numeric,   'USD', 0),
  ('2025-12-04'::date,'싱가포르', '4D',        9,  9, 816.5::numeric,   'USD', 1),
  -- 2026-01-12 싱가포르: TMK 4D 22캐빈 + ONLINE 4D 0캐빈 (동일 항차, 에이전트별 배정)
  ('2026-01-12'::date,'싱가포르', '4D',       22, 22, 661.92::numeric,  'USD', 0),
  ('2026-01-12'::date,'싱가포르', '4D',        0,  0, 731.92::numeric,  'USD', 1),
  ('2026-01-17'::date,'두바이',   'BA2',      32,  0, 934::numeric,     'EUR', 0),
  ('2026-01-29'::date,'싱가포르', '4D',       27, 27, 691.74::numeric,  'USD', 0),
  ('2026-02-05'::date,'싱가포르', '2D',        6,  6, 704.34::numeric,  'USD', 0),
  ('2026-02-05'::date,'싱가포르', '4D',       12, 12, 694.34::numeric,  'USD', 1),
  ('2026-02-06'::date,'호주',     '2D',       16,  0, 1508.5::numeric,  'USD', 0),
  ('2026-02-23'::date,'싱가포르', '4D',       16, 16, 734.54::numeric,  'USD', 0),
  ('2026-03-02'::date,'미서부',   '2D',        6,  6, 655.79::numeric,  'USD', 0),
  ('2026-03-02'::date,'미서부',   '4D',       12, 12, 584.79::numeric,  'USD', 1),
  ('2026-03-12'::date,'싱가포르', '4D',       16, 16, 813.56::numeric,  'USD', 0),
  ('2026-04-10'::date,'서부지중해','BA2',      15,  0, 1128::numeric,    'EUR', 0),
  ('2026-04-10'::date,'서부지중해','3인실',     1,  0, 2840::numeric,    'EUR', 1),
  ('2026-04-24'::date,'서부지중해','BR1',      15, 15, 1700::numeric,    'EUR', 0),
  ('2026-05-17'::date,'동북아',   'BR1',      14, 14, 1100::numeric,    'USD', 0),
  ('2026-05-17'::date,'알래스카', 'VC',        6,  6, 2149::numeric,    'USD', 0),
  ('2026-05-17'::date,'알래스카', 'VD',        3,  3, 2089::numeric,    'USD', 1),
  ('2026-06-05'::date,'동부지중해','BM1',      16,  0, 1460::numeric,    'EUR', 0),
  ('2026-06-13'::date,'동부지중해','BA2',      13, 13, 1368::numeric,    'EUR', 0),
  ('2026-06-13'::date,'동부지중해','3인실',     0,  0, 3567::numeric,    'EUR', 1),
  ('2026-08-09'::date,'북유럽',   '기본',     32,  0, 2338::numeric,    'EUR', 0),
  ('2026-08-29'::date,'동부지중해','BA2',      11, 11, 1593::numeric,    'EUR', 0),
  ('2026-08-29'::date,'동부지중해','기본',      0,  0, 1693::numeric,    'EUR', 1),
  ('2026-08-31'::date,'알래스카', '4D',       16,  0, 1928.5::numeric,  'USD', 0),
  ('2026-09-18'::date,'동부지중해','BM1',      16,  0, 1519::numeric,    'EUR', 0),
  ('2026-09-21'::date,'알래스카', 'BM1',      16,  0, 1344::numeric,    'USD', 0),
  ('2026-10-02'::date,'서부지중해','BR1',      21,  0, 1667::numeric,    'EUR', 0),
  ('2026-10-17'::date,'개기일식', '기본',     16,  0, 4284::numeric,    'USD', 0),
  ('2026-10-25'::date,'서부지중해','BA2',      16,  0, 1130::numeric,    'EUR', 0),
  ('2026-10-25'::date,'서부지중해','3인실',     1,  1, NULL::numeric,    'EUR', 1),
  -- 2026-11-29 싱가포르: TMK 2D + ONLINE 4D
  ('2026-11-29'::date,'싱가포르', '2D',       10, 10, 844.93::numeric,  'USD', 0),
  ('2026-11-29'::date,'싱가포르', '4D',        8,  8, 901.05::numeric,  'USD', 1),
  ('2026-12-10'::date,'싱가포르', '4D',       16, 15, 993.05::numeric,  'USD', 0),
  ('2027-01-03'::date,'홍콩',     '2D',       16,  0, 1161.5::numeric,  'USD', 0),
  ('2027-01-09'::date,'두바이',   'BA2',      16,  0, 1036::numeric,    'EUR', 0),
  -- 2027-01-28 싱가포르: TMK 2D + ONLINE 4D
  ('2027-01-28'::date,'싱가포르', '2D',       32,  0, 823::numeric,     'USD', 0),
  ('2027-01-28'::date,'싱가포르', '4D',       16,  0, 885.05::numeric,  'USD', 1),
  ('2027-02-14'::date,'동북아',   '4D',       16,  0, 1052.5::numeric,  'USD', 0),
  ('2027-02-22'::date,'미서부',   '2D',       16,  0, 703::numeric,     'USD', 0),
  -- 2027-03-09 싱가포르: TMK 2D + ONLINE 4D
  ('2027-03-09'::date,'싱가포르', '2D',        8,  8, 800::numeric,     'USD', 0),
  ('2027-03-09'::date,'싱가포르', '4D',       16, 16, 885.05::numeric,  'USD', 1),
  ('2027-03-13'::date,'싱가포르', '4D',       16, 15, 990.05::numeric,  'USD', 0),
  ('2027-04-18'::date,'동북아',   '4D',       16,  0, 1118.5::numeric,  'USD', 0),
  ('2027-04-18'::date,'동부지중해','기본',     16,  0, NULL::numeric,    'EUR', 0),
  ('2027-05-08'::date,'서부지중해','BR1',      16,  0, 1800::numeric,    'EUR', 0),
  ('2027-05-16'::date,'알래스카', 'VE',       16,  0, 2200::numeric,    'USD', 0),
  ('2027-08-15'::date,'알래스카', '기본',      0,  0, 2708::numeric,    'USD', 0),
  ('2027-09-11'::date,'서부지중해','BR1',      32,  0, 2020::numeric,    'EUR', 0),
  ('2027-10-17'::date,'동부지중해','기본',     16,  0, NULL::numeric,    'EUR', 0)
) AS d(dep, region_kw, grade, total, reserved, price, currency, sort_order)
ON v.departure_date = d.dep
  AND v.region ILIKE '%' || d.region_kw || '%';
