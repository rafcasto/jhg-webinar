-- ============================================================
-- Track the Kit countdown broadcasts created per occurrence+milestone
-- so the dispatcher is idempotent (never double-creates).
-- ============================================================
create table if not exists public.webinar_broadcasts (
  occurrence_id  text not null,
  milestone      text not null,            -- '48h' | '24h' | '1h' | '15m'
  broadcast_id   bigint,
  status         text,                     -- 'draft' | 'scheduled'
  send_at        timestamptz,
  created_at     timestamptz not null default now(),
  primary key (occurrence_id, milestone)
);

alter table public.webinar_broadcasts enable row level security;
drop policy if exists "admin read bcasts" on public.webinar_broadcasts;
create policy "admin read bcasts" on public.webinar_broadcasts for select to authenticated using (is_admin());
