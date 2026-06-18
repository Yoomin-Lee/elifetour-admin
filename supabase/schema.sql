-- =========================================================================
-- 이라이프투어 직원 관리 시스템 — Supabase 스키마
-- 모든 테이블은 접두사 eli_ 사용
-- =========================================================================

-- 1. 직원 프로필 (auth.users 1:1 확장)
create table if not exists eli_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text default 'staff',     -- staff | admin | escort
  status text not null default 'pending',  -- pending | approved
  created_at timestamptz default now()
);

-- 2. 여행 일정
create table if not exists eli_trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  destination text not null,
  depart_date date not null,
  return_date date not null,
  status text default 'upcoming',   -- upcoming | ongoing | completed | cancelled
  price_per_person int default 0,
  max_pax int default 0,
  manager text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 여행자 명단
create table if not exists eli_passengers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references eli_trips(id) on delete cascade,
  name text not null,
  birth_date date,
  gender text,                       -- M | F
  phone text,
  passport_no text,
  passport_expire date,
  nationality text default '한국',
  room_type text default 'double',   -- single | double | triple
  payment_status text default 'pending', -- pending | partial | paid
  payment_amount int default 0,
  special_request text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================================
-- RLS — 로그인한 직원 전원 열람·수정 가능
-- =========================================================================
alter table eli_profiles   enable row level security;
alter table eli_trips      enable row level security;
alter table eli_passengers enable row level security;

create policy "own profile"          on eli_profiles   for all using (auth.uid() = id) with check (auth.uid() = id);

-- 관리자 전체 프로필 접근 (security definer 함수로 재귀 RLS 방지)
create or replace function eli_is_admin()
returns boolean language sql security definer stable as $$
  select exists(select 1 from eli_profiles where id = auth.uid() and role = 'admin');
$$;
create policy "admin all profiles"   on eli_profiles   for all using (eli_is_admin()) with check (eli_is_admin());
create policy "staff read trips"     on eli_trips      for select using (auth.role() = 'authenticated');
create policy "staff write trips"    on eli_trips      for all   using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff read pax"       on eli_passengers for select using (auth.role() = 'authenticated');
create policy "staff write pax"      on eli_passengers for all   using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- =========================================================================
-- 신규 직원 가입 시 프로필 자동 생성
-- =========================================================================
create or replace function eli_handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into eli_profiles (id, email, display_name, avatar_url)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists eli_on_auth_user_created on auth.users;
create trigger eli_on_auth_user_created
  after insert on auth.users
  for each row execute function eli_handle_new_user();

-- =========================================================================
-- updated_at 자동 갱신
-- =========================================================================
create or replace function eli_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger eli_trips_updated_at      before update on eli_trips      for each row execute function eli_set_updated_at();
create trigger eli_passengers_updated_at before update on eli_passengers for each row execute function eli_set_updated_at();
