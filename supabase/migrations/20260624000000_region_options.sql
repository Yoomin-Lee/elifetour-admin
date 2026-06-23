-- 지역/상품명 드롭다운 옵션 관리 테이블
create table if not exists region_options (
  id         uuid        primary key default gen_random_uuid(),
  label      text        not null unique,
  sort_order int         not null default 0,
  created_at timestamptz not null default now()
);

-- 기본 지역 옵션 시드
insert into region_options (label, sort_order) values
  ('동북아',      1),
  ('싱가포르',    2),
  ('두바이',      3),
  ('미서부',      4),
  ('알래스카',    5),
  ('서부지중해',  6),
  ('동부지중해',  7),
  ('카리브해',    8),
  ('북유럽',      9),
  ('개기일식',   10),
  ('홍콩',       11),
  ('호주',       12)
on conflict (label) do nothing;

alter table region_options enable row level security;

create policy "read region_options"  on region_options for select using (auth.role() = 'authenticated');
create policy "write region_options" on region_options for insert with check (eli_get_my_role() in ('admin','staff'));
create policy "delete region_options" on region_options for delete using (eli_get_my_role() in ('admin','staff'));
create policy "update region_options" on region_options for update using (eli_get_my_role() in ('admin','staff'));
