-- 호텔 데이터 INSERT (35건)
-- currency: $ → USD, S$ → SGD, € → EUR, 미기재 → NULL
INSERT INTO hotels (voyage_id, stay_date, hotel_name, room_rate, currency, sort_order)
SELECT (SELECT id FROM voyages WHERE departure_date='2025-02-13' AND region='동북아'),
  '2025-02-13'::date,'CONRAD SHANGHAI',186::numeric,'USD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-02-14' AND region='싱가포르'),
  '2025-02-14','ORCHID',230,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-03-06' AND region='싱가포르'),
  '2025-03-06','ORCHID',230,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-04-04' AND region='미서부'),
  '2025-04-04','EXCALIBUR LAS VEGAS',165,'USD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-04-04' AND region='미서부'),
  '2025-04-05','WINGATE BY WYNDHAM PAGE',175,'USD',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-04-04' AND region='미서부'),
  '2025-04-06','HARRAH''S LAUGHLIN',135,'USD',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-04-04' AND region='미서부'),
  '2025-04-11','HOMEWOOD SUITES BY HILTON LOS ANGELES AIRPORT',225,'USD',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-04-25' AND region='동북아'),
  '2025-04-25','SHANGHAI MARRIOTT HOTEL YANGPU RIVERSIDE',165,'USD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-05-03' AND region='알래스카'),
  '2025-05-03','EMBASSY SUITES HILTON LYNNWOOD',230,'USD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-05-14' AND region='서부지중해'),
  '2025-05-14','ERGIFE PALACE HOTEL',150,'EUR',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-06-07' AND region='동부지중해'),
  '2025-06-07','ERGIFE PALACE HOTEL',150,'EUR',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-09-03' AND region='서부지중해'),
  '2025-09-03','ERGIFE PALACE HOTEL',190,'EUR',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-10-22' AND region='싱가포르'),
  '2025-10-22','ORCHID',230,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-10-29' AND region='싱가포르'),
  '2025-10-29','ALOFT NOVENA',220,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-05' AND region='싱가포르'),
  '2025-11-05','ORCHID',230,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-08' AND region='카리브해'),
  '2025-11-08','DOUBLETREE BY HILTON MIAMI DORAL',280,'USD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-08' AND region='카리브해'),
  '2025-11-15','DOUBLETREE BY HILTON MIAMI DORAL',280,'USD',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-11-12' AND region='싱가포르'),
  '2025-11-12','ORCHID',230,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2025-12-03' AND region='싱가포르'),
  '2025-12-03','ORCHID',230,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-01-11' AND region='싱가포르'),
  '2026-01-11','ORCHID',230,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-01-28' AND region='싱가포르'),
  '2026-01-28','ORCHID',230,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-04' AND region='싱가포르'),
  '2026-02-04','ORCHID',280,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-22' AND region='싱가포르'),
  '2026-02-22','ORCHID',230,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  '2026-02-27','HARRAH''S LAUGHLIN',170,'USD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  '2026-02-28','WINGATE BY WYNDHAM PAGE',145,'USD',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  '2026-03-01','PLANET HOLLYWOOD',195,'USD',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  '2026-03-06','SONESTA LA AIRPORT',170,'USD',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-03-11' AND region='싱가포르'),
  '2026-03-11','ORCHID',230,'SGD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-04-23' AND region='서부지중해'),
  '2026-04-23','ACTA SANT JUNT BARCELONA',180,'EUR',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-05-16' AND region='동북아'),
  '2026-05-16','TOBU HOTEL LEVANT TOKYO',NULL,NULL,1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-05-16' AND region='알래스카'),
  '2026-05-16','EMBASSY SUITES HILTON LYNNWOOD',230,'USD',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '2026-06-12','BEST WESTERN PLUS NET TOWER HOTEL PADOVA',173,'EUR',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '2026-08-28','BEST WESTERN PREMIER BHR TREVISO HOTEL',170,'EUR',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  '2026-10-01','ACTA SANT JUNT BARCELONA',180,'EUR',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  '2026-10-24','CATALONIA GRAN VERDI',160,'EUR',1
;
