-- 취소료 정책 INSERT
-- fee_type: 'percent' | 'fixed' | 'free'
-- start_d_minus NULL = 기준일 제한 없음 (~)
-- start_date NULL = #VALUE! (Excel 계산 불가 행)
INSERT INTO cancellation_policies
  (voyage_id, category, start_d_minus, end_d_minus, start_date, end_date, fee_description, fee_type, fee_value, fee_unit, note, sort_order)
-- ── 26/02/27 미서부 항공 ─────────────────────────────────────────────────
SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  '항공'::text,NULL::int,90::int,NULL::date,'2025-11-29'::date,'1%'::text,'percent'::fee_type,1::numeric,NULL::text,NULL::text,1::int
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  '항공',89,60,'2025-11-30','2025-12-29','2%','percent',2,NULL,NULL,2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  '항공',59,30,'2025-12-30','2026-01-28','10%','percent',10,NULL,NULL,3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  '항공',29,15,'2026-01-29','2026-02-12','30%','percent',30,NULL,NULL,4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-02-27' AND region='미서부'),
  '항공',14,0,'2026-02-13','2026-02-27','50%','percent',50,NULL,NULL,5
-- ── 26/06/12 동부지중해 항공 ─────────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '항공',70,46,'2026-04-03','2026-04-27','₩150,000','fixed',150000,'KRW',NULL,1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '항공',45,8,'2026-04-28','2026-06-04','₩200,000','fixed',200000,'KRW',NULL,2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '항공',7,0,'2026-06-05','2026-06-12','항공료 전액','fixed',1130000,'KRW',NULL,3
-- ── 26/06/12 동부지중해 크루즈 ───────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '크루즈',90,60,'2026-03-15','2026-04-14','DEPOSIT 20%','percent',20,NULL,NULL,4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '크루즈',60,45,'2026-04-14','2026-04-29','50%','percent',50,NULL,NULL,5
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '크루즈',45,30,'2026-04-29','2026-05-14','75%','percent',75,NULL,NULL,6
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '크루즈',30,0,'2026-05-14','2026-06-13','100%','percent',100,NULL,NULL,7
-- ── 26/08/28 동부지중해 항공 ─────────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '항공',NULL,31,NULL,'2026-07-28','₩50,000','fixed',50000,'KRW',NULL,1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '항공',30,8,'2026-07-29','2026-08-20','₩150,000','fixed',150000,'KRW',NULL,2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '항공',7,0,'2026-08-21','2026-08-28','항공료 전액','fixed',1472000,'KRW',NULL,3
-- ── 26/08/28 동부지중해 크루즈 ───────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '크루즈',90,60,'2026-05-31','2026-06-30','DEPOSIT 20%','percent',20,NULL,NULL,4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '크루즈',60,45,'2026-06-30','2026-07-15','50%','percent',50,NULL,NULL,5
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '크루즈',45,30,'2026-07-15','2026-07-30','75%','percent',75,NULL,NULL,6
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '크루즈',30,0,'2026-07-30','2026-08-29','100%','percent',100,NULL,NULL,7
-- ── 26/09/20 알래스카 항공 ───────────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  '항공',NULL,90,NULL,'2026-06-22','판매가 1%','percent',1,NULL,NULL,1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  '항공',89,60,'2026-06-23','2026-07-22','판매가 2%','percent',2,NULL,NULL,2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  '항공',59,30,'2026-07-23','2026-08-21','판매가 10%','percent',10,NULL,NULL,3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  '항공',29,15,'2026-08-22','2026-09-05','판매가 30%','percent',30,NULL,NULL,4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  '항공',14,0,'2026-09-06','2026-09-20','판매가 50%','percent',50,NULL,NULL,5
-- ── 26/09/20 알래스카 크루즈 ─────────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  '크루즈',NULL,91,NULL,'2026-06-22','45€','fixed',45,'EUR',NULL,6
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  '크루즈',90,61,'2026-06-23','2026-07-22','35%','percent',35,NULL,NULL,7
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  '크루즈',60,45,'2026-07-23','2026-08-07','50%','percent',50,NULL,NULL,8
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  '크루즈',44,21,'2026-08-08','2026-08-31','75%','percent',75,NULL,NULL,9
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-09-20' AND region='알래스카'),
  '크루즈',20,0,'2026-09-01','2026-09-21','100%','percent',100,NULL,NULL,10
-- ── 26/10/01 서부지중해 항공 ─────────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  '항공',30,15,'2026-09-01','2026-09-16','₩337,500','fixed',337500,'KRW',NULL,1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  '항공',14,7,'2026-09-17','2026-09-24','₩472,500','fixed',472500,'KRW',NULL,2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  '항공',6,4,'2026-09-25','2026-09-27','₩675,000','fixed',675000,'KRW',NULL,3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  '항공',4,0,'2026-09-27','2026-10-01','₩675,000','fixed',675000,'KRW',NULL,4
-- ── 26/10/01 서부지중해 크루즈 ───────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  '크루즈',NULL,91,NULL,'2026-07-03','45€','fixed',45,'EUR',NULL,5
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  '크루즈',90,61,'2026-07-04','2026-08-02','35%','percent',35,NULL,NULL,6
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  '크루즈',60,45,'2026-08-03','2026-08-18','50%','percent',50,NULL,NULL,7
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  '크루즈',44,21,'2026-08-19','2026-09-11','75%','percent',75,NULL,NULL,8
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-01' AND region='서부지중해'),
  '크루즈',20,0,'2026-09-12','2026-10-02','100%','percent',100,NULL,NULL,9
-- ── 26/10/24 서부지중해 항공 ─────────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  '항공',NULL,31,NULL,'2026-09-23','무료취소','free',0,NULL,NULL,1
-- ── 26/10/24 서부지중해 크루즈 ───────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  '크루즈',90,60,'2026-07-27','2026-08-26','DEPOSIT 20%','percent',20,NULL,NULL,2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  '크루즈',60,45,'2026-08-26','2026-09-10','50%','percent',50,NULL,NULL,3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  '크루즈',45,30,'2026-09-10','2026-09-25','75%','percent',75,NULL,NULL,4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  '크루즈',30,0,'2026-09-25','2026-10-25','100%','percent',100,NULL,NULL,5
-- ── 26/11/28 싱가포르 크루즈A (여기어때) ────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  '크루즈A',75,61,'2026-09-15','2026-09-29','신청금','fixed',NULL,NULL,'여기어때/8캐빈보유',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  '크루즈A',60,31,'2026-09-30','2026-10-29','CCF+NCCF 50%','percent',50,NULL,'여기어때',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  '크루즈A',30,15,'2026-10-30','2026-11-14','CCF+NCCF 75%','percent',75,NULL,'여기어때',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  '크루즈A',14,0,'2026-11-15','2026-11-29','CCF+NCCF 100%','percent',100,NULL,'여기어때',4
-- ── 26/11/28 싱가포르 크루즈B (TMK) ─────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  '크루즈B',74,60,'2026-09-16','2026-09-30','신청금','fixed',NULL,NULL,'TMK/10캐빈보유',5
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  '크루즈B',59,30,'2026-10-01','2026-10-30','CCF+NCCF 50%','percent',50,NULL,'TMK',6
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  '크루즈B',29,15,'2026-10-31','2026-11-14','CCF+NCCF 75%','percent',75,NULL,'TMK',7
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  '크루즈B',15,0,'2026-11-14','2026-11-29','CCF+NCCF 100%','percent',100,NULL,'TMK',8
-- ── 26/12/09 싱가포르 크루즈 (여기어때) ─────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-12-09' AND region='싱가포르'),
  '크루즈',75,61,'2026-09-26','2026-10-10','신청금','fixed',NULL,NULL,'여기어때',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-12-09' AND region='싱가포르'),
  '크루즈',60,31,'2026-10-11','2026-11-09','CCF+NCCF 50%','percent',50,NULL,'여기어때',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-12-09' AND region='싱가포르'),
  '크루즈',30,15,'2026-11-10','2026-11-25','CCF+NCCF 75%','percent',75,NULL,'여기어때',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-12-09' AND region='싱가포르'),
  '크루즈',14,0,'2026-11-26','2026-12-10','CCF+NCCF 100%','percent',100,NULL,'여기어때',4
-- ── 27/01/27 싱가포르 항공 ───────────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '항공',NULL,90,NULL,'2026-10-29','KE 1%','percent',1,NULL,'KE',1
-- ── 27/01/27 싱가포르 크루즈A (TMK) ─────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '크루즈A',74,60,'2026-11-15','2026-11-29','신청금','fixed',NULL,NULL,'TMK/32캐빈보유',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '크루즈A',59,30,'2026-11-30','2026-12-29','CCF+NCCF 50%','percent',50,NULL,'TMK',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '크루즈A',29,15,'2026-12-30','2027-01-13','CCF+NCCF 75%','percent',75,NULL,'TMK',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '크루즈A',14,0,'2027-01-14','2027-01-28','CCF+NCCF 100%','percent',100,NULL,'TMK',5
-- ── 27/01/27 싱가포르 크루즈B (여기어때) ────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '크루즈B',75,61,'2026-11-14','2026-11-28','신청금','fixed',NULL,NULL,'여기어때/16캐빈보유',6
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '크루즈B',60,31,'2026-11-29','2026-12-28','CCF+NCCF 50%','percent',50,NULL,'여기어때',7
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '크루즈B',30,15,'2026-12-29','2027-01-13','CCF+NCCF 75%','percent',75,NULL,'여기어때',8
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '크루즈B',14,0,'2027-01-14','2027-01-28','CCF+NCCF 100%','percent',100,NULL,'여기어때',9
-- ── 27/02/19 미서부 크루즈 ───────────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-02-19' AND region='미서부'),
  '크루즈',74,60,'2026-12-10','2026-12-24','신청금','fixed',NULL,NULL,NULL,1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-02-19' AND region='미서부'),
  '크루즈',59,30,'2026-12-25','2027-01-23','CCF+NCCF 50%','percent',50,NULL,NULL,2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-02-19' AND region='미서부'),
  '크루즈',29,15,'2027-01-24','2027-02-07','CCF+NCCF 75%','percent',75,NULL,NULL,3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-02-19' AND region='미서부'),
  '크루즈',14,0,'2027-02-08','2027-02-22','CCF+NCCF 100%','percent',100,NULL,NULL,4
-- ── 27/03/08 싱가포르 크루즈A (TMK) ─────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  '크루즈A',74,60,'2026-12-25','2027-01-08','신청금','fixed',NULL,NULL,'TMK/8캐빈보유',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  '크루즈A',59,30,'2027-01-09','2027-02-07','CCF+NCCF 50%','percent',50,NULL,'TMK',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  '크루즈A',29,15,'2027-02-08','2027-02-22','CCF+NCCF 75%','percent',75,NULL,'TMK',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  '크루즈A',14,0,'2027-02-23','2027-03-09','CCF+NCCF 100%','percent',100,NULL,'TMK',4
-- ── 27/03/08 싱가포르 크루즈B (여기어때) ────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  '크루즈B',75,61,'2026-12-24','2027-01-07','신청금','fixed',NULL,NULL,'여기어때/16캐빈보유',5
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  '크루즈B',60,31,'2027-01-08','2027-02-06','CCF+NCCF 50%','percent',50,NULL,'여기어때',6
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  '크루즈B',30,15,'2027-02-07','2027-02-22','CCF+NCCF 75%','percent',75,NULL,'여기어때',7
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  '크루즈B',14,0,'2027-02-23','2027-03-09','CCF+NCCF 100%','percent',100,NULL,'여기어때',8
-- ── 27/03/12 싱가포르 항공 ───────────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-12' AND region='싱가포르'),
  '항공',NULL,101,NULL,'2026-12-01','KE 1%','percent',1,NULL,'KE',1
-- ── 27/03/12 싱가포르 크루즈 (여기어때) ─────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-12' AND region='싱가포르'),
  '크루즈',75,61,'2026-12-28','2027-01-11','신청금','fixed',NULL,NULL,'여기어때',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-12' AND region='싱가포르'),
  '크루즈',60,31,'2027-01-12','2027-02-10','CCF+NCCF 50%','percent',50,NULL,'여기어때',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-12' AND region='싱가포르'),
  '크루즈',30,15,'2027-02-11','2027-02-26','CCF+NCCF 75%','percent',75,NULL,'여기어때',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-12' AND region='싱가포르'),
  '크루즈',14,0,'2027-02-27','2027-03-13','CCF+NCCF 100%','percent',100,NULL,'여기어때',5
-- ── 27/04/17 동북아 크루즈 ───────────────────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-04-17' AND region='동북아'),
  '크루즈',74,60,'2027-02-03','2027-02-17','신청금','fixed',NULL,NULL,NULL,1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-04-17' AND region='동북아'),
  '크루즈',59,30,'2027-02-18','2027-03-19','CCF+NCCF 50%','percent',50,NULL,NULL,2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-04-17' AND region='동북아'),
  '크루즈',29,15,'2027-03-20','2027-04-03','CCF+NCCF 75%','percent',75,NULL,NULL,3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-04-17' AND region='동북아'),
  '크루즈',14,0,'2027-04-04','2027-04-18','CCF+NCCF 100%','percent',100,NULL,NULL,4
-- ── 27/05/07 서부지중해 크루즈 (바스코) ─────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-05-07' AND region='서부지중해'),
  '크루즈',NULL,75,NULL,'2027-02-22','데포 20%','percent',20,NULL,'바스코',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-05-07' AND region='서부지중해'),
  '크루즈',74,60,'2027-02-23','2027-03-09','객실당 $150','fixed',150,'USD','바스코',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-05-07' AND region='서부지중해'),
  '크루즈',59,50,'2027-03-10','2027-03-19','크루즈요금 25%','percent',25,NULL,'바스코',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-05-07' AND region='서부지중해'),
  '크루즈',49,30,'2027-03-20','2027-04-08','크루즈요금 50%','percent',50,NULL,'바스코',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-05-07' AND region='서부지중해'),
  '크루즈',29,0,'2027-04-09','2027-05-08','크루즈+항구세 100%','percent',100,NULL,'바스코',5
-- ── 27/09/10 서부지중해 크루즈 (바스코) ─────────────────────────────────
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-09-10' AND region='서부지중해'),
  '크루즈',NULL,75,NULL,'2027-06-28','데포 20%','percent',20,NULL,'바스코',1
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-09-10' AND region='서부지중해'),
  '크루즈',74,60,'2027-06-29','2027-07-13','객실당 $150','fixed',150,'USD','바스코',2
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-09-10' AND region='서부지중해'),
  '크루즈',59,50,'2027-07-14','2027-07-23','크루즈요금 25%','percent',25,NULL,'바스코',3
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-09-10' AND region='서부지중해'),
  '크루즈',49,30,'2027-07-24','2027-08-12','크루즈요금 50%','percent',50,NULL,'바스코',4
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-09-10' AND region='서부지중해'),
  '크루즈',29,0,'2027-08-13','2027-09-11','크루즈+항구세 100%','percent',100,NULL,'바스코',5
;
