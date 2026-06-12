-- =========================================================================
-- 역할 기반 접근 제어 (RLS)
-- 역할: admin(관리자) | staff(직원) | escort(인솔자)
-- =========================================================================

-- 1. role 허용값 제약
alter table eli_profiles
  drop constraint if exists eli_profiles_role_check;
alter table eli_profiles
  add constraint eli_profiles_role_check
  check (role in ('admin', 'staff', 'escort'));

-- 2. 역할 조회 헬퍼 (SECURITY DEFINER → RLS 우회, 재귀 없음)
create or replace function eli_get_my_role()
returns text language sql security definer stable
set search_path = public
as $$ select coalesce(role, 'staff') from eli_profiles where id = auth.uid() $$;

-- 3. 기존 전체 허용 정책 제거
drop policy if exists "own profile"        on eli_profiles;
drop policy if exists "staff read trips"   on eli_trips;
drop policy if exists "staff write trips"  on eli_trips;
drop policy if exists "staff read pax"     on eli_passengers;
drop policy if exists "staff write pax"    on eli_passengers;

-- ── eli_profiles ──────────────────────────────────────────────────────────
-- 로그인한 직원 전원 조회 가능 (팀원 목록 등)
create policy "read all profiles" on eli_profiles
  for select using (auth.role() = 'authenticated');

-- 본인 프로필 수정 가능 (role 변경은 아래 트리거가 차단)
create policy "update own profile" on eli_profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── eli_trips ─────────────────────────────────────────────────────────────
create policy "read trips" on eli_trips
  for select using (auth.role() = 'authenticated');

create policy "staff insert trips" on eli_trips
  for insert with check (eli_get_my_role() in ('admin', 'staff'));

create policy "staff update trips" on eli_trips
  for update using  (eli_get_my_role() in ('admin', 'staff'))
  with check        (eli_get_my_role() in ('admin', 'staff'));

create policy "admin delete trips" on eli_trips
  for delete using (eli_get_my_role() = 'admin');

-- ── eli_passengers ────────────────────────────────────────────────────────
create policy "read passengers" on eli_passengers
  for select using (auth.role() = 'authenticated');

create policy "staff insert passengers" on eli_passengers
  for insert with check (eli_get_my_role() in ('admin', 'staff'));

create policy "staff update passengers" on eli_passengers
  for update using  (eli_get_my_role() in ('admin', 'staff'))
  with check        (eli_get_my_role() in ('admin', 'staff'));

create policy "admin delete passengers" on eli_passengers
  for delete using (eli_get_my_role() = 'admin');

-- 4. 트리거: 관리자가 아닌 사용자의 role 필드 변경 차단
create or replace function eli_guard_role_change()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare my_role text;
begin
  if old.role is distinct from new.role then
    select coalesce(role, 'staff') into my_role
      from eli_profiles where id = auth.uid();
    if my_role != 'admin' then
      raise exception 'Only admins can change roles';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists eli_profiles_role_guard on eli_profiles;
create trigger eli_profiles_role_guard
  before update on eli_profiles
  for each row execute function eli_guard_role_change();
