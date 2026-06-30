-- ── feedback_logs (피드백 메모) ───────────────────────────────────────────
create table feedback_logs (
  id         uuid        primary key default gen_random_uuid(),
  voyage_id  uuid        not null references voyages(id) on delete cascade,
  logged_at  timestamptz not null default now(),
  author     text,
  content    text        not null
);

alter table feedback_logs enable row level security;

create policy "staff feedback"
  on feedback_logs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
