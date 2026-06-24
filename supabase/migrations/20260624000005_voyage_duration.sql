-- voyages 테이블에 여행기간 직접 입력 컬럼 추가
alter table voyages add column if not exists duration text;
