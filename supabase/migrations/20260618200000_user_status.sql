-- =========================================================================
-- 사용자 승인 시스템 — eli_profiles에 status 컬럼 추가
-- pending(대기) | approved(승인)
-- 기존 유저는 모두 approved 처리
-- =========================================================================

-- 1. status 컬럼 추가 (신규 가입자는 기본 pending)
alter table eli_profiles
  add column if not exists status text not null default 'pending';

-- 2. 기존 유저 전원 approved 처리 (서비스 단절 방지)
update eli_profiles set status = 'approved' where status = 'pending';

-- =========================================================================
-- 관리자 전체 프로필 접근 정책
-- NOTE: security definer 함수로 재귀 RLS 방지
-- =========================================================================

-- 관리자 확인 헬퍼 (SECURITY DEFINER = RLS 우회하여 재귀 방지)
create or replace function eli_is_admin()
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from eli_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 관리자는 모든 프로필 조회·수정 가능
drop policy if exists "admin all profiles" on eli_profiles;
create policy "admin all profiles"
  on eli_profiles for all
  using (eli_is_admin())
  with check (eli_is_admin());
