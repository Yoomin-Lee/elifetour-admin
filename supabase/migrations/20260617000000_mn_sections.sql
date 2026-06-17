-- MN 참고 자료: 취소료/팁 규정 섹션 저장
CREATE TABLE IF NOT EXISTS mn_sections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text        NOT NULL,          -- '취소료' | 'MSC상세' | '팁'
  title       text        NOT NULL,
  description text,                          -- 섹션 추가 설명 (부제목, 주의사항 등)
  row_type    text        NOT NULL DEFAULT 'rule', -- 'rule' | 'tip'
  rows        jsonb       NOT NULL DEFAULT '[]',
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE mn_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_mn_sections"  ON mn_sections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_mn_sections" ON mn_sections FOR ALL    USING (auth.role() = 'authenticated');

-- 초기 데이터 (하드코드 → DB 이관)
INSERT INTO mn_sections (category, title, description, row_type, rows, sort_order) VALUES
  ('취소료', '코스타 취소료 규정 (2025~)',
   '중동 그룹: 출발 90일 전 옵션 데잇\n지중해 그룹: 출발 60일 전 옵션 데잇',
   'rule',
   '[{"d":"90~60일 전","fee":"DEPOSIT 20%","note":""},{"d":"60~45일 전","fee":"50%","note":""},{"d":"45~30일 전","fee":"75%","note":""},{"d":"30~0일 전","fee":"100%","note":""}]',
   1),

  ('취소료', 'TMK 취소료 규정',
   NULL,
   'rule',
   '[{"d":"74~60일 전","fee":"신청금","note":""},{"d":"59~30일 전","fee":"CCF+NCCF의 50%","note":"신청금이 더 클 경우 신청금 금액"},{"d":"29~15일 전","fee":"CCF+NCCF의 75%","note":""},{"d":"14~0일 전","fee":"CCF+NCCF의 100%","note":""}]',
   2),

  ('취소료', '여기어때 취소료 규정',
   NULL,
   'rule',
   '[{"d":"75~61일 전","fee":"$125","note":""},{"d":"60~31일 전","fee":"50%","note":""},{"d":"30~15일 전","fee":"75%","note":""},{"d":"14~0일 전","fee":"100%","note":""}]',
   3),

  ('취소료', 'MSC 취소료 규정',
   NULL,
   'rule',
   '[{"d":"D-91 이상","fee":"€45","note":""},{"d":"90~61일 전","fee":"FARE의 35%","note":""},{"d":"60~45일 전","fee":"FARE의 50%","note":""},{"d":"44~21일 전","fee":"FARE의 75%","note":""},{"d":"20~0일 전","fee":"FARE의 100%","note":""}]',
   4),

  ('취소료', 'MSC 데포 규정',
   NULL,
   'rule',
   '[{"d":"확정 시","fee":"15%","note":""},{"d":"90일 전","fee":"35%","note":""},{"d":"30일 전","fee":"잔금","note":""}]',
   5),

  ('취소료', 'KE 취소료 규정',
   '미주/구주/대양주/중동/아프리카 행: 60일 전 확정석 (80% 미만 사용 시 패널티)\n동남아/서남아/괌/日/中/동북아/극동 행: 45일 전 확정석 (80% 미만 사용 시 패널티)',
   'rule',
   '[{"d":"D-~90","fee":"판매가 1%","note":""},{"d":"D-89~60","fee":"판매가 2%","note":""},{"d":"D-59~30","fee":"판매가 10%","note":""},{"d":"D-29~15","fee":"판매가 30%","note":""},{"d":"D-14~0","fee":"판매가 50%","note":""}]',
   6),

  ('MSC상세', '27/05/08 월드유로파',
   '예약 데포짓 규정\n2026년 5월 15일까지: at confirmation 20% (Non-refundable)\n잔금: 2027년 4월 16일까지 100% 완납',
   'rule',
   '[{"d":"74일~60일 전","fee":"객실당 $150 USD","note":""},{"d":"59일~50일 전","fee":"크루즈 요금 25%","note":""},{"d":"49일~30일 전","fee":"크루즈 요금 50%","note":""},{"d":"출발 29일~당일","fee":"크루즈 요금 + 항구세 100%","note":"영업일 오후 4시 이후 접수 시 다음 영업일 기준 처리"}]',
   1),

  ('MSC상세', '27/09/11 월드유로파',
   '예약 데포짓 규정\n2026년 6월 15일까지: at confirmation 20% (Non-refundable)\n잔금: 2027년 8월 31일까지 100% 완납',
   'rule',
   '[{"d":"74일~60일 전","fee":"객실당 $150 USD","note":""},{"d":"59일~50일 전","fee":"크루즈 요금 25%","note":""},{"d":"49일~30일 전","fee":"크루즈 요금 50%","note":""},{"d":"출발 29일~당일","fee":"크루즈 요금 + 항구세 100%","note":"영업일 오후 4시 이후 접수 시 다음 영업일 기준 처리"}]',
   2),

  ('팁', '코스타 크루즈 팁 (2026/01/12~)',
   '델리지오사/디아데마/파시노사/퍼시피카/세레나/스메랄다/토스카나',
   'tip',
   '[{"room":"델리지오사 외","amount":"$13 성인 / $7 아동"},{"room":"그 외 선박","amount":"$14.5 성인 / $7 아동"}]',
   1),

  ('팁', '홀랜드 아메리카 팁 (2026/06/01~)',
   NULL,
   'tip',
   '[{"room":"스위트","amount":"$20"},{"room":"그 외 객실","amount":"$18"}]',
   2),

  ('팁', '로얄 캐리비안 팁',
   NULL,
   'tip',
   '[{"room":"스위트","amount":"$21"},{"room":"그 외 객실","amount":"$18.5"}]',
   3);
