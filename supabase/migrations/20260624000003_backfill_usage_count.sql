-- 기존 행사 데이터 기준으로 usage_count 초기화

-- 지역/상품명: voyages.region 기준 집계
UPDATE region_options ro
SET usage_count = sub.cnt
FROM (
  SELECT region AS label, COUNT(*) AS cnt
  FROM voyages
  WHERE region IS NOT NULL AND region <> ''
  GROUP BY region
) sub
WHERE ro.label = sub.label;

-- 항공사: voyages.airline + voyages.airline_return 합산
UPDATE airline_options ao
SET usage_count = sub.cnt
FROM (
  SELECT label, SUM(cnt) AS cnt
  FROM (
    SELECT airline AS label, COUNT(*) AS cnt
    FROM voyages
    WHERE airline IS NOT NULL AND airline <> ''
    GROUP BY airline
    UNION ALL
    SELECT airline_return AS label, COUNT(*) AS cnt
    FROM voyages
    WHERE airline_return IS NOT NULL AND airline_return <> ''
    GROUP BY airline_return
  ) combined
  GROUP BY label
) sub
WHERE ao.label = sub.label;
