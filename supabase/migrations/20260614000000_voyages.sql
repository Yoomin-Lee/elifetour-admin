-- =========================================================================
-- 항차검색/행사 통합 조회 시스템 — DB 마이그레이션
-- =========================================================================

-- ── Enum Types ────────────────────────────────────────────────────────────
create type voyage_status as enum ('미오픈', '판매중', '마감', '출발완료', '취소');
create type fee_type      as enum ('percent', 'fixed', 'free');

-- ── voyages (항차 마스터) ─────────────────────────────────────────────────
create table voyages (
  id              uuid        primary key default gen_random_uuid(),
  region          text        not null,
  status          voyage_status not null default '미오픈',
  airline         text,
  cruise_line     text,
  ship_name       text,
  departure_date  date        not null,
  return_date     date,
  cabin_total     int         not null default 0,
  cabin_remaining int         not null default 0,
  customer_count  int         not null default 0,
  tour_leader     text,
  hotel           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── flights (항공, voyage당 N개) ──────────────────────────────────────────
create table flights (
  id              uuid        primary key default gen_random_uuid(),
  voyage_id       uuid        not null references voyages(id) on delete cascade,
  flight_no       text,
  origin          text,
  destination     text,
  departure_date  date,
  arrival_date    date,
  departure_time  time,
  arrival_time    time,
  duration        text,
  fare            numeric,
  sort_order      int         not null default 0,
  created_at      timestamptz not null default now()
);

-- ── itinerary_days (기항지 일정, voyage당 N개) ───────────────────────────
create table itinerary_days (
  id              uuid    primary key default gen_random_uuid(),
  voyage_id       uuid    not null references voyages(id) on delete cascade,
  date            date    not null,
  port            text    not null,
  arrival_time    time,
  departure_time  time,
  category        text,
  cost            numeric,
  summary         text,
  sort_order      int     not null default 0
);

-- ── cancellation_policies (취소료 구간) ──────────────────────────────────
create table cancellation_policies (
  id               uuid     primary key default gen_random_uuid(),
  voyage_id        uuid     not null references voyages(id) on delete cascade,
  category         text,
  start_d_minus    int,
  end_d_minus      int,
  start_date       date,
  end_date         date,
  fee_description  text,
  fee_type         fee_type,
  fee_value        numeric,
  fee_unit         text,
  note             text,
  sort_order       int not null default 0
);

-- ── history_logs (수동 메모 히스토리) ────────────────────────────────────
create table history_logs (
  id         uuid        primary key default gen_random_uuid(),
  voyage_id  uuid        not null references voyages(id) on delete cascade,
  logged_at  timestamptz not null default now(),
  author     text,
  content    text        not null
);

-- ── audit_logs (자동 감사 로그) ──────────────────────────────────────────
create table audit_logs (
  id          uuid        primary key default gen_random_uuid(),
  table_name  text        not null,
  record_id   uuid,
  operation   text        not null,
  changed_by  uuid        references auth.users(id),
  old_data    jsonb,
  new_data    jsonb,
  logged_at   timestamptz not null default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table voyages               enable row level security;
alter table flights               enable row level security;
alter table itinerary_days        enable row level security;
alter table cancellation_policies enable row level security;
alter table history_logs          enable row level security;
alter table audit_logs            enable row level security;

create policy "staff voyages"      on voyages               for all    using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "staff flights"      on flights               for all    using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "staff itinerary"    on itinerary_days        for all    using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "staff cancel"       on cancellation_policies for all    using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "staff history"      on history_logs          for all    using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "staff audit_read"   on audit_logs            for select using (auth.role()='authenticated');

-- ── updated_at trigger (voyages) ─────────────────────────────────────────
create trigger voyages_updated_at
  before update on voyages
  for each row execute function eli_set_updated_at();

-- ── 감사 로그 function & triggers ────────────────────────────────────────
create or replace function log_voyage_audit()
returns trigger language plpgsql security definer as $$
begin
  insert into audit_logs (table_name, record_id, operation, changed_by, old_data, new_data)
  values (
    TG_TABLE_NAME,
    coalesce(
      case when TG_OP = 'DELETE' then old.id else new.id end,
      null
    ),
    TG_OP,
    auth.uid(),
    case when TG_OP = 'INSERT' then null else to_jsonb(old) end,
    case when TG_OP = 'DELETE' then null else to_jsonb(new) end
  );
  return case when TG_OP = 'DELETE' then old else new end;
end;
$$;

create trigger voyages_audit
  after insert or update or delete on voyages
  for each row execute function log_voyage_audit();

create trigger flights_audit
  after insert or update or delete on flights
  for each row execute function log_voyage_audit();
