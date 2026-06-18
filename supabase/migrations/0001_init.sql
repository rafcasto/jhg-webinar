-- ============================================================
-- JobHackers Global — Webinar Funnel schema
-- Funnel: landing -> register -> quiz (background lead score) -> thank-you
-- Lead storage is an EVENT LOG: one row per (email, tag, stage).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- helper: updated_at ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============================================================
-- 1. CMS: editable content blocks (per page/section)
-- ============================================================
create table if not exists content_blocks (
  id          uuid primary key default gen_random_uuid(),
  page        text not null,
  key         text not null,
  label       text not null,
  type        text not null default 'text',
  value       text,
  position    int  not null default 0,
  updated_at  timestamptz not null default now(),
  unique (page, key)
);
drop trigger if exists content_blocks_updated on content_blocks;
create trigger content_blocks_updated before update on content_blocks
  for each row execute function set_updated_at();

-- ============================================================
-- 2. CMS: CTAs (label + URL + placement)
-- ============================================================
create table if not exists ctas (
  id          uuid primary key default gen_random_uuid(),
  page        text not null,
  slot        text not null,
  label       text not null,
  url         text not null default '#',
  sublabel    text,
  icon        text,
  style       text not null default 'primary',
  position    int  not null default 0,
  enabled     boolean not null default true,
  updated_at  timestamptz not null default now(),
  unique (page, slot)
);
drop trigger if exists ctas_updated on ctas;
create trigger ctas_updated before update on ctas
  for each row execute function set_updated_at();

-- ============================================================
-- 3. Quiz: questions + options (admin add/remove/edit, scored)
-- ============================================================
create table if not exists quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  position    int  not null default 0,
  prompt      text not null,
  help_text   text,
  type        text not null default 'single',
  scored      boolean not null default true,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists quiz_questions_updated on quiz_questions;
create trigger quiz_questions_updated before update on quiz_questions
  for each row execute function set_updated_at();

create table if not exists quiz_options (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references quiz_questions(id) on delete cascade,
  position     int  not null default 0,
  label        text not null,
  value        text not null,
  score        int  not null default 0,
  archetype    text null,
  enabled      boolean not null default true
);
create index if not exists quiz_options_qid on quiz_options(question_id);

-- ============================================================
-- 4. Webinar events (synced from Zoom recurring meetings)
-- ============================================================
create table if not exists webinar_events (
  id              uuid primary key default gen_random_uuid(),
  zoom_meeting_id text,
  occurrence_id   text,
  topic           text,
  start_time      timestamptz not null,
  duration_min    int,
  timezone        text,
  join_url        text,
  registration_url text,
  status          text not null default 'scheduled',
  fetched_at      timestamptz not null default now(),
  unique (zoom_meeting_id, occurrence_id)
);
create index if not exists webinar_events_start on webinar_events(start_time);

-- ============================================================
-- 5. Leads — event log (acquisition, activation, ...)
-- ============================================================
do $$ begin
  create type public.lead_stage as enum
    ('acquisition','activation','retention','revenue','referral');
exception when duplicate_object then null; end $$;

create table if not exists public.jobhackers_leads (
  id          uuid not null default gen_random_uuid(),
  first_name  text not null,
  last_name   text null,
  email       text not null,
  stage       public.lead_stage not null default 'acquisition'::lead_stage,
  tag         text null,
  source      text null,
  score       integer not null default 0,
  archetype   text null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  location    text null,
  constraint jobhackers_leads_pkey primary key (id),
  constraint jobhackers_leads_email_tag_stage_key unique nulls not distinct (email, tag, stage)
);
create index if not exists idx_jobhackers_leads_stage  on public.jobhackers_leads using btree (stage);
create index if not exists idx_jobhackers_leads_source on public.jobhackers_leads using btree (source);
drop trigger if exists trg_jobhackers_leads_updated_at on jobhackers_leads;
create trigger trg_jobhackers_leads_updated_at before update on jobhackers_leads
  for each row execute function set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table content_blocks         enable row level security;
alter table ctas                   enable row level security;
alter table quiz_questions         enable row level security;
alter table quiz_options           enable row level security;
alter table webinar_events         enable row level security;
alter table public.jobhackers_leads enable row level security;

-- public read (render the funnel)
drop policy if exists "public read content" on content_blocks;
create policy "public read content" on content_blocks for select using (true);
drop policy if exists "public read ctas" on ctas;
create policy "public read ctas" on ctas           for select using (true);
drop policy if exists "public read q" on quiz_questions;
create policy "public read q" on quiz_questions for select using (enabled);
drop policy if exists "public read opts" on quiz_options;
create policy "public read opts" on quiz_options   for select using (enabled);
drop policy if exists "public read events" on webinar_events;
create policy "public read events" on webinar_events for select using (true);

-- admin (authenticated) write
drop policy if exists "admin write content" on content_blocks;
create policy "admin write content" on content_blocks for all to authenticated using (true) with check (true);
drop policy if exists "admin write ctas" on ctas;
create policy "admin write ctas" on ctas           for all to authenticated using (true) with check (true);
drop policy if exists "admin write q" on quiz_questions;
create policy "admin write q" on quiz_questions for all to authenticated using (true) with check (true);
drop policy if exists "admin write opts" on quiz_options;
create policy "admin write opts" on quiz_options   for all to authenticated using (true) with check (true);
drop policy if exists "admin write events" on webinar_events;
create policy "admin write events" on webinar_events for all to authenticated using (true) with check (true);

-- leads: admins read; writes go through SECURITY DEFINER RPCs (no anon table access)
drop policy if exists "admin read leads" on public.jobhackers_leads;
create policy "admin read leads" on public.jobhackers_leads for select to authenticated using (true);
drop policy if exists "admin write leads" on public.jobhackers_leads;
create policy "admin write leads" on public.jobhackers_leads for all to authenticated using (true) with check (true);
