-- 히스토리 로그 INSERT (24건)
-- logged_at: PDF 날짜 기준 KST 00:00
INSERT INTO history_logs (voyage_id, logged_at, author, content)
SELECT (SELECT id FROM voyages WHERE departure_date='2026-04-23' AND region='서부지중해'),
  '2026-01-27 00:00:00+09'::timestamptz,'MS'::text,
  'MARSEILLEE - MARSEILLES ESSENTIALS : BASILICA, VIEUX-PORT & COASTAL DRIVE - MRS06 (4h, $72)'||chr(10)||
  'GENOA - A SCENIC BUS TOUR OF THE CITYS FINEST SIGHTS - GOA18T (4h, $43)'||chr(10)||
  'MESSINA - A DAY EXPLORING MESSINA AND TAORMINAS HIGHLIGHTS - MES01 (6h, $82) (시간 확인 필요)'||chr(10)||
  '기항지투어 예약중'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '2026-06-09 00:00:00+09','MN',
  '기항지투어 예약중'||chr(10)||
  'BARI - 0122 ALBEROBELLO, THE VILLAGE OF TRULLI: A FAIRYTALE EXPERIENCE / 79 EUR / 5 Hours'||chr(10)||
  'SANTORINI - 0922 ALL OF OIA: THROUGH THE WHITE AND BLUE STREETS, AT YOUR OWN PACE / 85 EUR / 4 Hours'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '2025-11-19 00:00:00+09','MS',
  'Bari - 0122 ALBEROBELLO, THE VILLAGE OF TRULLI : A FAIRYTALE EXPERIENCE Adult price 79.00 EUR'||chr(10)||
  'Corfu - 02GZ PALEOKASTRITSA & CORFU, Adult price 79.00 EUR'||chr(10)||
  'Argostoli - 00ZE KEFALONIA : MELISSANI AND MYRTOS, NATURAL MASTERMICES, Adult price 59.00 EUR'||chr(10)||
  'Dubrovnik - 2175 PANORAMIC WALK ALONG DUBROVNIKS HISTORIC WALLS, Adult price 99.00 EUR'||chr(10)||
  'Kotor - 1036 PERAST, VISIT TO "OUR LADY OF THE ROCKS" AND KOTOR, Adult price 55.00 EUR'||chr(10)||
  'Zadar - 04IJ A DAY IN THE KRKA NATIONAL PARK, Adult price 95.00 EUR'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '2026-04-13 00:00:00+09','MS',
  '코스타 그리스 입도세 > 인당 10유로(코르푸, 아르고스톨리 각 5유로씩) > 선결제 불가, 선내에서 인솔자가 몰아내기로 요청'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '2026-04-14 00:00:00+09','MS',
  '정찬 1ST SITTING ALBATROS'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '2026-04-13 00:00:00+09','MS',
  '코스타 그리스 입도세 > 인당 45유로(미코&산토 20유로, 카타콜론 5유로) > 선결제 불가, 선내에서 인솔자가 몰아내기로 요청'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '2026-04-29 00:00:00+09','MS',
  '하선 날 공항가기 전에 VALECENTER 방문'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '2026-05-06 00:00:00+09','MS',
  '1인 추가금 326만원 안내'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '2026-06-02 00:00:00+09','MS',
  '정찬 1ST SITTING ALBATROS'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  '2026-02-12 00:00:00+09','MS',
  '바셀, 나폴리, 로마 - 랜드 / 칼리아리, 제노바, 마르세유 - 쇼렉스'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '2026-03-17 00:00:00+09','MS',
  '4인실(유치원생+20개월) 추가금 265만원/180만원 안내, 3인실(유치원생) 추가금 248만원 안내'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  '2026-06-09 00:00:00+09','MS',
  '토성 OZ 명단 TL 9/9, 발권 TL 9/22'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-11-28' AND region='싱가포르'),
  '2026-06-09 00:00:00+09','MS',
  '토성 SQ 52석 데포 TL 10/29, 발권 TL 11/23'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-12-09' AND region='싱가포르'),
  '2026-06-09 00:00:00+09','MS',
  '토성 SQ 32석 데포 TL 11/9, 발권 TL 12/3'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '2026-06-09 00:00:00+09','MS',
  '토성 KE 32석 명단 TL 12/23, 발권 TL 1/13'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-01-27' AND region='싱가포르'),
  '2026-06-09 00:00:00+09','MS',
  '토성 SQ 64석 데포 TL 10/22, 발권 TL 1/11'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-03-08' AND region='싱가포르'),
  '2026-06-09 00:00:00+09','MS',
  '토성 SQ 32+16석 데포 TL 12/31, 발권 TL 2/23'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-06-12' AND region='동부지중해'),
  '2026-06-05 00:00:00+09','MS',
  '고경왕님 요청 - 박복희님(고경왕님의 모) 허리가 안좋으셔서 뒤로 젖히기 편한 좌석이나 통로 좌석 요청'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-04-17' AND region='동북아'),
  '2026-06-09 00:00:00+09','MS',
  '정찬 1ST SITTING 4:45PM'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  '2026-02-25 00:00:00+09','MS',
  '3인실 요청 > 추가금 없이 안내함 > 한다고 함'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-10-24' AND region='서부지중해'),
  '2026-02-05 00:00:00+09','MS',
  'OZ 그룹 확보 D-30 무료 취소'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2026-08-28' AND region='동부지중해'),
  '2026-06-11 00:00:00+09','MN',
  '인원 20명으로 항공 26석 기준 6석 미달(취소로 발생 예정), 크루즈 추가모객 바로 문의해서 진행해도 될 듯 3캐빈 정도'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-02-19' AND region='미서부'),
  '2026-06-12 00:00:00+09','MN',
  '1인실 추가금 435만원 휴먼 안내'
UNION ALL SELECT (SELECT id FROM voyages WHERE departure_date='2027-09-10' AND region='서부지중해'),
  '2026-06-12 00:00:00+09','MN',
  '캐빈요금 +$20, 바스코 오타로 캐빈요금 정정, 추후 $256 잔금 진행 시 같이 진행하기로'
;
