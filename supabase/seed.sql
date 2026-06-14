-- =========================================================================
-- 시드 데이터: 27/09/10 서부지중해 (MSC WORLD EUROPA)
-- =========================================================================

-- voyages
insert into voyages (id, region, status, airline, cruise_line, ship_name,
  departure_date, return_date, cabin_total, cabin_remaining, customer_count,
  tour_leader, hotel)
values (
  'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',
  '서부지중해', '미오픈', '대한항공', 'MSC', 'WORLD EUROPA',
  '2027-09-10', '2027-09-19', 32, 32, 0,
  '미정', '미정'
);

-- flights (왕복 2편)
insert into flights (voyage_id, flight_no, origin, destination, departure_date, arrival_date, departure_time, arrival_time, duration, fare, sort_order)
values
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', 'KE907',  '인천(ICN)', '바르셀로나(BCN)', '2027-09-10', '2027-09-10', '13:30', '19:10', '12h 40m', 0, 1),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', 'KE908',  '바르셀로나(BCN)', '인천(ICN)', '2027-09-19', '2027-09-20', '21:20', '17:05', '12h 45m', 0, 2);

-- itinerary_days (10일 일정)
insert into itinerary_days (voyage_id, date, port, arrival_time, departure_time, summary, sort_order)
values
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2027-09-10', '바르셀로나 (스페인)', null,     '17:00', '인천 출발 → 바르셀로나 승선', 1),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2027-09-11', '해상', null, null, '크루즈 이동', 2),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2027-09-12', '마르세유 (프랑스)', '08:00', '17:00', '마르세유 항구 관광, 노트르담 드 라 가르드 대성당', 3),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2027-09-13', '제노바 (이탈리아)', '08:00', '17:00', '구시가지 카루기 골목, 랜턴 등대 조망', 4),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2027-09-14', '치비타베키아/로마 (이탈리아)', '07:00', '19:00', '로마 입성 — 콜로세움, 바티칸', 5),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2027-09-15', '나폴리/카프리 (이탈리아)', '08:00', '20:00', '나폴리 또는 카프리섬 투어', 6),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2027-09-16', '해상', null, null, '크루즈 이동', 7),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2027-09-17', '발레타 (몰타)', '08:00', '17:00', '기사단의 수도 발레타 구시가 탐방', 8),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2027-09-18', '팔레르모 (시칠리아, 이탈리아)', '08:00', '18:00', '팔레르모 왕궁, 팔라티나 예배당', 9),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '2027-09-19', '바르셀로나 (스페인)', '07:00', null, '하선 후 공항 이동, 귀국 탑승', 10);

-- cancellation_policies (취소료 구간)
insert into cancellation_policies (voyage_id, category, start_d_minus, end_d_minus, fee_description, fee_type, fee_value, fee_unit, sort_order)
values
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '크루즈', null, 90, '데포 20%', 'percent', 20, '인당', 1),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '크루즈', 89,  60, '크루즈요금 25%', 'percent', 25, '인당', 2),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '크루즈', 59,  30, '크루즈요금 50%', 'percent', 50, '인당', 3),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '크루즈', 29,  15, '크루즈요금 75%', 'percent', 75, '인당', 4),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '크루즈', 14,   0, '크루즈+항구세 100%', 'percent', 100, '인당', 5),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '항공',  null,  0, '항공사 규정 적용', null, null, null, 6);

-- history_logs (초기 메모)
insert into history_logs (voyage_id, author, content)
values
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '관리자', '행사 최초 등록 — 시드 데이터'),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', '관리자', '캐빈 32개 확보 확인 (2027-06-14)');
