-- 항공사 드롭다운 옵션 관리 테이블
create table if not exists airline_options (
  id         uuid        primary key default gen_random_uuid(),
  label      text        not null unique,
  sort_order int         not null default 0,
  created_at timestamptz not null default now()
);

insert into airline_options (label, sort_order) values
  ('OZ (아시아나항공)',   1),
  ('KE (대한항공)',       2),
  ('SQ (싱가포르항공)',   3),
  ('EK (에미레이트)',     4),
  ('QR (카타르항공)',     5),
  ('LH (루프트한자)',     6),
  ('TK (터키항공)',       7),
  ('DL (델타항공)',       8)
on conflict (label) do nothing;

alter table airline_options enable row level security;
create policy "read airline_options"   on airline_options for select using (auth.role() = 'authenticated');
create policy "write airline_options"  on airline_options for insert with check (eli_get_my_role() in ('admin','staff'));
create policy "delete airline_options" on airline_options for delete using (eli_get_my_role() in ('admin','staff'));
create policy "update airline_options" on airline_options for update using (eli_get_my_role() in ('admin','staff'));

-- voyages 테이블에 귀항 항공사 컬럼 추가
alter table voyages add column if not exists airline_return text;
