-- voyage_flights 데이터 INSERT
-- dep_datetime / arr_datetime: "현지시각 AT TIME ZONE 'IANA명'" → PostgreSQL이 UTC로 자동 저장
-- duration 텍스트는 PDF 기재값 그대로 사용
INSERT INTO voyage_flights
  (voyage_id, flight_num, dep_airport, arr_airport, dep_datetime, arr_datetime, flight_duration, flight_fare, currency_code, sort_order)
SELECT (SELECT id FROM voyages WHERE departure_date='2025-02-13' AND region='동북아'),
  'OZ363','ICN','PVG',
  '2025-02-13 10:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-02-13 11:55:00'::timestamp AT TIME ZONE 'Asia/Shanghai',
  '2시간 05분',381500,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-02-13' AND region='동북아'),
  'OZ364','PVG','ICN',
  '2025-02-19 13:10:00'::timestamp AT TIME ZONE 'Asia/Shanghai',
  '2025-02-19 16:00:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '1시간 50분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-02-14' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2025-02-14 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-02-14 14:25:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 35분',751700,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-02-14' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2025-02-20 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2025-02-20 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-02-22' AND region='두바이'),
  'KE1410','PUS','ICN',
  '2025-02-22 07:55:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-02-22 09:05:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '1시간 10분',256400,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-02-22' AND region='두바이'),
  'KE951','ICN','DXB',
  '2025-02-22 12:45:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-02-22 18:30:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '10시간 45분',1297300,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-02-22' AND region='두바이'),
  'KE952','DXB','ICN',
  '2025-03-01 21:00:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '2025-03-02 10:30:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '8시간 30분',NULL,'KRW',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-02-22' AND region='두바이'),
  'KE1411','ICN','PUS',
  '2025-03-02 14:05:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-03-02 15:15:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '1시간 10분',NULL,'KRW',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-03-06' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2025-03-06 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-03-06 14:25:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 35분',751700,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-03-06' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2025-03-12 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2025-03-12 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-04-04' AND region='미서부'),
  'OZ202','ICN','LAX',
  '2025-04-04 14:40:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-04-04 09:40:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '11시간 00분',1530000,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-04-04' AND region='미서부'),
  'OZ201','LAX','ICN',
  '2025-04-12 12:10:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '2025-04-13 17:35:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '13시간 25분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-04-25' AND region='동북아'),
  'OZ363','ICN','PVG',
  '2025-04-25 10:45:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-04-25 11:45:00'::timestamp AT TIME ZONE 'Asia/Shanghai',
  '2시간 00분',394200,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-04-25' AND region='동북아'),
  'OZ364','PVG','ICN',
  '2025-05-01 13:10:00'::timestamp AT TIME ZONE 'Asia/Shanghai',
  '2025-05-01 16:00:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '1시간 50분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-05-03' AND region='알래스카'),
  'KE041','ICN','SEA',
  '2025-05-03 16:40:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-05-03 10:50:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '10시간 10분',1960000,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-05-03' AND region='알래스카'),
  'KE042','SEA','ICN',
  '2025-05-11 13:00:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '2025-05-12 16:40:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '11시간 40분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-05-14' AND region='서부지중해'),
  'EK323','ICN','DXB',
  '2025-05-13 23:55:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-05-14 04:25:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '9시간 30분',1321400,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-05-14' AND region='서부지중해'),
  'EK097','DXB','FCO',
  '2025-05-14 09:10:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '2025-05-14 13:25:00'::timestamp AT TIME ZONE 'Europe/Rome',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-05-14' AND region='서부지중해'),
  'EK098','FCO','DXB',
  '2025-05-22 15:40:00'::timestamp AT TIME ZONE 'Europe/Rome',
  '2025-05-22 23:20:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '5시간 40분',NULL,'KRW',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-05-14' AND region='서부지중해'),
  'EK322','DXB','ICN',
  '2025-05-23 03:40:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '2025-05-23 17:00:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '8시간 20분',NULL,'KRW',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-06-07' AND region='동부지중해'),
  'QR859','ICN','DOH',
  '2025-06-07 01:20:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-06-07 05:30:00'::timestamp AT TIME ZONE 'Asia/Qatar',
  '10시간 10분',1580000,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-06-07' AND region='동부지중해'),
  'QR131','DOH','FCO',
  '2025-06-07 09:25:00'::timestamp AT TIME ZONE 'Asia/Qatar',
  '2025-06-07 14:15:00'::timestamp AT TIME ZONE 'Europe/Rome',
  '5시간 50분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-06-07' AND region='동부지중해'),
  'QR132','FCO','DOH',
  '2025-06-15 16:10:00'::timestamp AT TIME ZONE 'Europe/Rome',
  '2025-06-15 22:40:00'::timestamp AT TIME ZONE 'Asia/Qatar',
  '5시간 30분',NULL,'KRW',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-06-07' AND region='동부지중해'),
  'QR858','DOH','ICN',
  '2025-06-16 02:20:00'::timestamp AT TIME ZONE 'Asia/Qatar',
  '2025-06-16 17:05:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '8시간 45분',NULL,'KRW',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-09-03' AND region='서부지중해'),
  'QR859','ICN','DOH',
  '2025-09-03 01:20:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-09-03 05:10:00'::timestamp AT TIME ZONE 'Asia/Qatar',
  '9시간 50분',1321400,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-09-03' AND region='서부지중해'),
  'QR131','DOH','FCO',
  '2025-09-03 09:25:00'::timestamp AT TIME ZONE 'Asia/Qatar',
  '2025-09-03 14:15:00'::timestamp AT TIME ZONE 'Europe/Rome',
  '5시간 50분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-09-03' AND region='서부지중해'),
  'QR132','FCO','DOH',
  '2025-09-11 16:10:00'::timestamp AT TIME ZONE 'Europe/Rome',
  '2025-09-11 22:40:00'::timestamp AT TIME ZONE 'Asia/Qatar',
  '5시간 30분',NULL,'KRW',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-09-03' AND region='서부지중해'),
  'QR858','DOH','ICN',
  '2025-09-12 02:20:00'::timestamp AT TIME ZONE 'Asia/Qatar',
  '2025-09-12 17:05:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '8시간 45분',NULL,'KRW',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-09-14' AND region='알래스카'),
  'KE041','ICN','SEA',
  '2025-09-14 16:40:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-09-14 10:40:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '10시간 00분',1449900,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-09-14' AND region='알래스카'),
  'KE042','SEA','ICN',
  '2025-09-22 13:00:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '2025-09-23 16:10:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '11시간 10분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-10-22' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2025-10-22 09:00:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-10-22 14:20:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 20분',770100,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-10-22' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2025-10-28 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2025-10-28 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-10-29' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2025-10-29 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-10-29 14:20:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 30분',713100,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-10-29' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2025-11-04 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2025-11-04 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-05' AND region='싱가포르'),
  'SQ611','ICN','SIN',
  '2025-11-05 12:35:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-11-05 18:20:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 45분',852300,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-05' AND region='싱가포르'),
  'SQ612','SIN','ICN',
  '2025-11-11 02:30:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2025-11-11 09:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 20분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-08' AND region='카리브해'),
  'DL188','ICN','ATL',
  '2025-11-08 18:00:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-11-08 17:35:00'::timestamp AT TIME ZONE 'America/New_York',
  '12시간 35분',2150600,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-08' AND region='카리브해'),
  'DL1107','ATL','FLL',
  '2025-11-08 21:25:00'::timestamp AT TIME ZONE 'America/New_York',
  '2025-11-08 23:22:00'::timestamp AT TIME ZONE 'America/New_York',
  '1시간 57분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-08' AND region='카리브해'),
  'DL1168','FLL','ATL',
  '2025-11-16 05:30:00'::timestamp AT TIME ZONE 'America/New_York',
  '2025-11-16 07:24:00'::timestamp AT TIME ZONE 'America/New_York',
  '1시간 54분',NULL,'KRW',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-08' AND region='카리브해'),
  'DL189','ATL','ICN',
  '2025-11-16 09:45:00'::timestamp AT TIME ZONE 'America/New_York',
  '2025-11-17 15:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '17시간 05분',NULL,'KRW',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-12' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2025-11-12 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-11-12 14:25:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 35분',782300,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-12' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2025-11-18 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2025-11-18 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-12-03' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2025-12-03 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2025-12-03 14:20:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 30분',853100,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-12-03' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2025-12-09 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2025-12-09 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-01-11' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2026-01-11 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-01-11 14:20:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 30분',785600,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-01-11' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2026-01-17 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2026-01-17 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-01-17' AND region='두바이'),
  'KE951','ICN','DXB',
  '2026-01-17 12:45:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-01-17 18:40:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '10시간 55분',1666300,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-01-17' AND region='두바이'),
  'KE952','DXB','ICN',
  '2026-01-24 21:00:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '2026-01-25 10:30:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '8시간 30분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-01-28' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2026-01-28 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-01-28 14:20:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 30분',785600,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-01-28' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2026-02-03 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2026-02-03 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-04' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2026-02-04 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-02-04 14:20:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 30분',785600,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-04' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2026-02-10 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2026-02-10 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-22' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2026-02-22 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-02-22 14:20:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 30분',685600,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-22' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2026-02-28 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2026-02-28 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  'KE017','ICN','LAX',
  '2026-02-27 14:30:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-02-27 08:30:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '10시간 00분',1430000,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  'KE018','LAX','ICN',
  '2026-03-07 10:50:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '2026-03-08 17:35:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '14시간 45분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-03-11' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2026-03-11 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-03-11 14:25:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 35분',585600,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-03-11' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2026-03-17 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2026-03-17 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-04-23' AND region='서부지중해'),
  'LH719','ICN','MUC',
  '2026-04-23 11:40:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-04-23 17:30:00'::timestamp AT TIME ZONE 'Europe/Berlin',
  '12시간 50분',1530000,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-04-23' AND region='서부지중해'),
  'LH1818','MUC','BCN',
  '2026-04-23 20:15:00'::timestamp AT TIME ZONE 'Europe/Berlin',
  '2026-04-23 22:25:00'::timestamp AT TIME ZONE 'Europe/Madrid',
  '2시간 10분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-04-23' AND region='서부지중해'),
  'LH4161','BCN','MUC',
  '2026-05-01 11:50:00'::timestamp AT TIME ZONE 'Europe/Madrid',
  '2026-05-01 14:00:00'::timestamp AT TIME ZONE 'Europe/Berlin',
  '2시간 10분',NULL,'KRW',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-04-23' AND region='서부지중해'),
  'LH718','MUC','ICN',
  '2026-05-01 15:55:00'::timestamp AT TIME ZONE 'Europe/Berlin',
  '2026-05-02 09:55:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '11시간 00분',NULL,'KRW',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-05-16' AND region='동북아'),
  'OZ102','ICN','NRT',
  '2026-05-16 08:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-05-16 10:50:00'::timestamp AT TIME ZONE 'Asia/Tokyo',
  '2시간 25분',468300,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-05-16' AND region='동북아'),
  'OZ101','NRT','ICN',
  '2026-05-22 12:50:00'::timestamp AT TIME ZONE 'Asia/Tokyo',
  '2026-05-22 15:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2시간 35분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-05-16' AND region='알래스카'),
  'KE041','ICN','SEA',
  '2026-05-16 16:40:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-05-16 10:40:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '10시간 00분',1516700,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-05-16' AND region='알래스카'),
  'KE042','SEA','ICN',
  '2026-05-24 12:50:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '2026-05-24 16:40:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '11시간 50분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  'TK21','ICN','IST',
  '2026-06-12 10:15:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-06-12 15:55:00'::timestamp AT TIME ZONE 'Europe/Istanbul',
  '11시간 40분',2093100,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  'TK1869','IST','VCE',
  '2026-06-12 17:25:00'::timestamp AT TIME ZONE 'Europe/Istanbul',
  '2026-06-12 19:00:00'::timestamp AT TIME ZONE 'Europe/Rome',
  '2시간 35분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  'TK1870','VCE','IST',
  '2026-06-20 20:00:00'::timestamp AT TIME ZONE 'Europe/Rome',
  '2026-06-20 23:35:00'::timestamp AT TIME ZONE 'Europe/Istanbul',
  '2시간 35분',NULL,'KRW',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  'TK90','IST','ICN',
  '2026-06-21 01:50:00'::timestamp AT TIME ZONE 'Europe/Istanbul',
  '2026-06-21 17:40:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '9시간 50분',NULL,'KRW',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  'EK323','ICN','DXB',
  '2026-08-27 23:55:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-08-28 04:25:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '9시간 30분',1598200,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  'EK135','DXB','VCE',
  '2026-08-28 09:05:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '2026-08-28 13:30:00'::timestamp AT TIME ZONE 'Europe/Rome',
  '6시간 25분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  'EK136','VCE','DXB',
  '2026-09-05 15:35:00'::timestamp AT TIME ZONE 'Europe/Rome',
  '2026-09-05 23:20:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '5시간 45분',NULL,'KRW',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  'EK322','DXB','ICN',
  '2026-09-06 03:40:00'::timestamp AT TIME ZONE 'Asia/Dubai',
  '2026-09-06 17:00:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '8시간 20분',NULL,'KRW',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  'KE041','ICN','SEA',
  '2026-09-20 16:40:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-09-20 10:40:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '10시간 00분',1770000,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  'KE042','SEA','ICN',
  '2026-09-28 12:50:00'::timestamp AT TIME ZONE 'America/Los_Angeles',
  '2026-09-29 16:40:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '11시간 50분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  'OZ511','ICN','BCN',
  '2026-10-01 11:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-10-01 19:10:00'::timestamp AT TIME ZONE 'Europe/Madrid',
  '14시간 20분',2469100,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  'OZ512','BCN','ICN',
  '2026-10-09 20:50:00'::timestamp AT TIME ZONE 'Europe/Madrid',
  '2026-10-10 16:20:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '12시간 30분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  'OZ511','ICN','BCN',
  '2026-10-24 11:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-10-24 19:10:00'::timestamp AT TIME ZONE 'Europe/Madrid',
  '14시간 20분',1892400,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  'OZ512','BCN','ICN',
  '2026-11-01 19:35:00'::timestamp AT TIME ZONE 'Europe/Madrid',
  '2026-11-02 16:05:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '12시간 30분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2026-11-28 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-11-28 14:25:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 35분',879800,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2026-12-04 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2026-12-04 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-12-09' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2026-12-09 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2026-12-09 14:25:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 35분',879800,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-12-09' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2026-12-15 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2026-12-15 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-02' AND region='홍콩'),
  'OZ721','ICN','HKG',
  '2027-01-02 09:00:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2027-01-02 12:00:00'::timestamp AT TIME ZONE 'Asia/Hong_Kong',
  '4시간 00분',739500,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-02' AND region='홍콩'),
  'OZ722','HKG','ICN',
  '2027-01-08 13:10:00'::timestamp AT TIME ZONE 'Asia/Hong_Kong',
  '2027-01-08 17:30:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '3시간 20분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2027-01-27 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2027-01-27 14:25:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 35분',879500,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  'KE643','ICN','SIN',
  '2027-01-27 14:35:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2027-01-27 20:25:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 50분',877800,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  'KE644','SIN','ICN',
  '2027-02-01 22:30:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2027-02-02 05:45:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2027-02-02 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2027-02-02 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-02-13' AND region='동북아'),
  'OZ363','ICN','PVG',
  '2027-02-13 10:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2027-02-13 11:55:00'::timestamp AT TIME ZONE 'Asia/Shanghai',
  '2시간 05분',575300,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-02-13' AND region='동북아'),
  'OZ364','PVG','ICN',
  '2027-02-19 13:10:00'::timestamp AT TIME ZONE 'Asia/Shanghai',
  '2027-02-19 16:00:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '1시간 50분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  'SQ607','ICN','SIN',
  '2027-03-08 08:50:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2027-03-08 14:25:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 35분',699500,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  'SQ608','SIN','ICN',
  '2027-03-14 00:10:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2027-03-14 07:25:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-12' AND region='싱가포르'),
  'KE643','ICN','SIN',
  '2027-03-12 14:35:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '2027-03-12 20:25:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '6시간 50분',1097600,'KRW',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-12' AND region='싱가포르'),
  'KE644','SIN','ICN',
  '2027-03-17 22:30:00'::timestamp AT TIME ZONE 'Asia/Singapore',
  '2027-03-18 05:45:00'::timestamp AT TIME ZONE 'Asia/Seoul',
  '6시간 15분',NULL,'KRW',2
;
