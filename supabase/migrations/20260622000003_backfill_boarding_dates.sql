-- 1) boarding_date 컬럼 추가 (없으면)
ALTER TABLE voyages ADD COLUMN IF NOT EXISTS boarding_date DATE;

-- 2) 크루즈.pdf 기준 전체 행사 승선일 일괄 입력
--    departure_date 기준 매칭 (같은 출발일의 모든 항차 동일 승선일 적용)
UPDATE voyages SET boarding_date = '2025-02-14' WHERE departure_date = '2025-02-13';
UPDATE voyages SET boarding_date = '2025-02-15' WHERE departure_date = '2025-02-14';
UPDATE voyages SET boarding_date = '2025-02-22' WHERE departure_date = '2025-02-22';
UPDATE voyages SET boarding_date = '2025-03-07' WHERE departure_date = '2025-03-06';
UPDATE voyages SET boarding_date = '2025-04-07' WHERE departure_date = '2025-04-04';
UPDATE voyages SET boarding_date = '2025-04-26' WHERE departure_date = '2025-04-25';
UPDATE voyages SET boarding_date = '2025-05-04' WHERE departure_date = '2025-05-03';
UPDATE voyages SET boarding_date = '2025-05-15' WHERE departure_date = '2025-05-14';
UPDATE voyages SET boarding_date = '2025-06-08' WHERE departure_date = '2025-06-07';
UPDATE voyages SET boarding_date = '2025-09-04' WHERE departure_date = '2025-09-03';
UPDATE voyages SET boarding_date = '2025-09-15' WHERE departure_date = '2025-09-14';
UPDATE voyages SET boarding_date = '2025-09-28' WHERE departure_date = '2025-09-27';
UPDATE voyages SET boarding_date = '2025-10-23' WHERE departure_date = '2025-10-22';
UPDATE voyages SET boarding_date = '2025-10-30' WHERE departure_date = '2025-10-29';
UPDATE voyages SET boarding_date = '2025-11-06' WHERE departure_date = '2025-11-05';
UPDATE voyages SET boarding_date = '2025-11-09' WHERE departure_date = '2025-11-08';
UPDATE voyages SET boarding_date = '2025-11-13' WHERE departure_date = '2025-11-12';
UPDATE voyages SET boarding_date = '2025-12-04' WHERE departure_date = '2025-12-03';
UPDATE voyages SET boarding_date = '2026-01-12' WHERE departure_date = '2026-01-11';
UPDATE voyages SET boarding_date = '2026-01-17' WHERE departure_date = '2026-01-17';
UPDATE voyages SET boarding_date = '2026-01-29' WHERE departure_date = '2026-01-28';
UPDATE voyages SET boarding_date = '2026-02-05' WHERE departure_date = '2026-02-04';
UPDATE voyages SET boarding_date = '2026-02-06' WHERE departure_date = '2026-02-05';
UPDATE voyages SET boarding_date = '2026-02-23' WHERE departure_date = '2026-02-22';
UPDATE voyages SET boarding_date = '2026-03-02' WHERE departure_date = '2026-02-27';
UPDATE voyages SET boarding_date = '2026-03-12' WHERE departure_date = '2026-03-11';
UPDATE voyages SET boarding_date = '2026-04-10' WHERE departure_date = '2026-04-09';
UPDATE voyages SET boarding_date = '2026-04-24' WHERE departure_date = '2026-04-23';
UPDATE voyages SET boarding_date = '2026-05-17' WHERE departure_date = '2026-05-16';
UPDATE voyages SET boarding_date = '2026-06-05' WHERE departure_date = '2026-06-04';
UPDATE voyages SET boarding_date = '2026-06-13' WHERE departure_date = '2026-06-12';
UPDATE voyages SET boarding_date = '2026-08-09' WHERE departure_date = '2026-08-08';
UPDATE voyages SET boarding_date = '2026-08-29' WHERE departure_date = '2026-08-28';
UPDATE voyages SET boarding_date = '2026-08-31' WHERE departure_date = '2026-08-30';
UPDATE voyages SET boarding_date = '2026-09-18' WHERE departure_date = '2026-09-17';
UPDATE voyages SET boarding_date = '2026-09-21' WHERE departure_date = '2026-09-20';
UPDATE voyages SET boarding_date = '2026-10-02' WHERE departure_date = '2026-10-01';
UPDATE voyages SET boarding_date = '2026-10-17' WHERE departure_date = '2026-10-16';
UPDATE voyages SET boarding_date = '2026-10-25' WHERE departure_date = '2026-10-24';
UPDATE voyages SET boarding_date = '2026-11-29' WHERE departure_date = '2026-11-28';
UPDATE voyages SET boarding_date = '2026-12-10' WHERE departure_date = '2026-12-09';
UPDATE voyages SET boarding_date = '2027-01-03' WHERE departure_date = '2027-01-02';
UPDATE voyages SET boarding_date = '2027-01-09' WHERE departure_date = '2027-01-09';
UPDATE voyages SET boarding_date = '2027-01-28' WHERE departure_date = '2027-01-27';
UPDATE voyages SET boarding_date = '2027-02-14' WHERE departure_date = '2027-02-13';
UPDATE voyages SET boarding_date = '2027-02-22' WHERE departure_date = '2027-02-19';
UPDATE voyages SET boarding_date = '2027-03-09' WHERE departure_date = '2027-03-08';
UPDATE voyages SET boarding_date = '2027-03-13' WHERE departure_date = '2027-03-12';
UPDATE voyages SET boarding_date = '2027-04-18' WHERE departure_date = '2027-04-17';
UPDATE voyages SET boarding_date = '2027-05-08' WHERE departure_date = '2027-05-07';
UPDATE voyages SET boarding_date = '2027-05-16' WHERE departure_date = '2027-05-15';
UPDATE voyages SET boarding_date = '2027-08-15' WHERE departure_date = '2027-08-14';
UPDATE voyages SET boarding_date = '2027-09-11' WHERE departure_date = '2027-09-10';
UPDATE voyages SET boarding_date = '2027-10-17' WHERE departure_date = '2027-10-16';

-- 결과 확인
SELECT departure_date, boarding_date, region
FROM voyages
WHERE boarding_date IS NOT NULL
ORDER BY departure_date;
