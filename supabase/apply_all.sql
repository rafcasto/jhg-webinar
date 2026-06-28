-- Combined schema for paste into Supabase SQL editor.
-- Fully idempotent: safe to run repeatedly. Generated from migrations/0001-0006.

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


-- ============================================================
-- Seed: JobHackers job-seeker quiz, landing/thank-you content, CTAs.
-- Idempotent: each question is keyed by position; safe to re-run.
-- ============================================================

-- Q1 — situation / urgency
with q as (
  insert into quiz_questions (position, prompt, help_text, type, scored)
  select 1, 'Where are you in your job search right now?',
         'Please take 20 seconds to answer a few quick questions:', 'single', true
  where not exists (select 1 from quiz_questions where position = 1)
  returning id
)
insert into quiz_options (question_id, position, label, value, score)
select id, p, l, v, s from q,
  (values (1,'Recently laid off / between roles','between_roles',25),
          (2,'Applying but getting no traction','no_traction',22),
          (3,'Employed but want out','want_out',15),
          (4,'Exploring a career change','career_change',15),
          (5,'Just starting to think about it','early',5)) as o(p,l,v,s);

-- Q2 — timeline
with q as (
  insert into quiz_questions (position, prompt, type, scored)
  select 2, 'How soon do you need to land your next role?', 'single', true
  where not exists (select 1 from quiz_questions where position = 2)
  returning id
)
insert into quiz_options (question_id, position, label, value, score)
select id, p, l, v, s from q,
  (values (1,'ASAP / within 30 days','asap',25),
          (2,'1 to 3 months','1_3_months',20),
          (3,'3 to 6 months','3_6_months',10),
          (4,'Just exploring','exploring',3)) as o(p,l,v,s);

-- Q3 — biggest obstacle (drives archetype)
with q as (
  insert into quiz_questions (position, prompt, type, scored)
  select 3, 'What''s holding your search back the most?', 'single', true
  where not exists (select 1 from quiz_questions where position = 3)
  returning id
)
insert into quiz_options (question_id, position, label, value, score, archetype)
select id, p, l, v, s, a from q,
  (values (1,'I''m not getting interviews','no_interviews',12,'The Overlooked'),
          (2,'I get interviews but no offers','no_offers',12,'The Almost'),
          (3,'I don''t know how to network / hidden market','networking',10,'The Connector'),
          (4,'My LinkedIn/resume isn''t landing','positioning',10,'The Positioner'),
          (5,'I''m not sure what role I want','direction',8,'The Explorer'),
          (6,'I struggle to negotiate salary','negotiation',8,'The Undersold')) as o(p,l,v,s,a);

-- Q4 — level / value
with q as (
  insert into quiz_questions (position, prompt, type, scored)
  select 4, 'What best describes your level?', 'single', true
  where not exists (select 1 from quiz_questions where position = 4)
  returning id
)
insert into quiz_options (question_id, position, label, value, score)
select id, p, l, v, s from q,
  (values (1,'Executive / Director','executive',25),
          (2,'Senior / Manager','senior',20),
          (3,'Mid-level professional','mid',15),
          (4,'Early career','early_career',8),
          (5,'Student / entry','student',3)) as o(p,l,v,s);

-- Q5 — readiness to invest
with q as (
  insert into quiz_questions (position, prompt, type, scored)
  select 5, 'How ready are you to invest in a proven system to get hired faster?', 'single', true
  where not exists (select 1 from quiz_questions where position = 5)
  returning id
)
insert into quiz_options (question_id, position, label, value, score)
select id, p, l, v, s from q,
  (values (1,'Ready to invest now','ready_now',30),
          (2,'Open if it''s the right fit','open',15),
          (3,'Just want the free workshop','free_only',3)) as o(p,l,v,s);

-- Q6 — attribution (not scored)
with q as (
  insert into quiz_questions (position, prompt, type, scored)
  select 6, 'How did you first hear about this workshop?', 'single', false
  where not exists (select 1 from quiz_questions where position = 6)
  returning id
)
insert into quiz_options (question_id, position, label, value, score)
select id, p, l, v, 0 from q,
  (values (1,'Instagram','instagram'),
          (2,'YouTube','youtube'),
          (3,'Podcast','podcast'),
          (4,'LinkedIn','linkedin'),
          (5,'Google search','google'),
          (6,'Word of mouth','word_of_mouth'),
          (7,'Other','other')) as o(p,l,v);

-- ---------- Editable content blocks ----------
insert into content_blocks (page, key, label, type, value, position) values
  ('landing','hero_eyebrow','Hero eyebrow / series title','text','The New Rules of Getting Hired Masterclass',1),
  ('landing','hero_title','Hero headline','text','You Did Everything Right. The Rules Changed Anyway.',2),
  ('landing','hero_subtitle','Hero subheadline','textarea','The free fortnightly masterclass for professionals who are stuck — whether you''re job hunting, changing careers, or chasing the promotion you''ve earned. Learn how to get understood and chosen in a job market that quietly rewrote the rules. With David Perry & Laurent Simon.',3),
  ('landing','benefit_1','Hero benefit 1','text','Get a clear lane the market understands in seconds',4),
  ('landing','benefit_2','Hero benefit 2','text','Turn your experience into proof that gets you chosen',5),
  ('landing','benefit_3','Hero benefit 3','text','Walk away with a system — not just more applications',6),
  ('landing','hero_prize','Prize / giveaway hook','text','Live on the call: one attendee gets a free résumé + LinkedIn teardown.',7),
  ('landing','logo_strip','Logo bar caption','text','As featured in',8),
  ('landing','problem_heading','Problem heading','text','The Problem Isn''t You. It''s How the Market Reads You.',9),
  ('landing','problem_1_title','Problem 1 title','text','You''re blurry.',10),
  ('landing','problem_1_desc','Problem 1 body','textarea','You''re qualified, but the market can''t tell what you do or where you fit — so you get filtered out, undervalued, or ignored.',11),
  ('landing','problem_2_title','Problem 2 title','text','You''re applying into the void.',12),
  ('landing','problem_2_desc','Problem 2 body','textarea','Volume and hope. Endless applications, generic résumés, and silence back. That''s panic with Wi-Fi — not a strategy.',13),
  ('landing','problem_3_title','Problem 3 title','text','You sound like everyone else.',14),
  ('landing','problem_3_desc','Problem 3 body','textarea','"Experienced professional with strong communication skills." Your profile blurs into a thousand lookalikes the moment AI flooded the market.',15),
  ('landing','who_heading','Who-is-it-for heading','text','Who Is It For',16),
  ('landing','who_intro','Who-is-it-for intro','text','Whatever "stuck" looks like for you, the fix starts the same way — clarity.',17),
  ('landing','who_1_title','Audience 1 title','text','The Job Seeker',18),
  ('landing','who_1_desc','Audience 1 body','textarea','You lost your job and need to land fast. You''ve been applying for months with no traction, stuck in limbo.',19),
  ('landing','who_1_em','Audience 1 payoff','text','You''ll learn how to compress your time-to-value and get hired sooner.',20),
  ('landing','who_2_title','Audience 2 title','text','The Career Changer',21),
  ('landing','who_2_desc','Audience 2 body','textarea','You feel stuck in the wrong role and you''re ready to reinvent — to pivot into work that delivers more value and sits closer to what drives you.',22),
  ('landing','who_2_em','Audience 2 payoff','text','You''ll learn how to reposition your experience for a new lane the market will pay for.',23),
  ('landing','who_3_title','Audience 3 title','text','The Promotion Seeker',24),
  ('landing','who_3_desc','Audience 3 body','textarea','You''re employed but underpaid and under-promoted. You want the raise and title where you are — or a better deal elsewhere.',25),
  ('landing','who_3_em','Audience 3 payoff','text','You''ll learn how to prove your value and negotiate like a pro.',26),
  ('landing','method_heading','Method heading','text','The Method',27),
  ('landing','method_subline','Method sub-line','text','Clarity → Proof → System',28),
  ('landing','method_1_title','Method step 1 title','text','Find your lane.',29),
  ('landing','method_1_desc','Method step 1 body','textarea','State what you do in one sentence the market instantly understands. Your lane isn''t a prison cell — it''s a firing position.',30),
  ('landing','method_2_title','Method step 2 title','text','Follow the pain to the paycheck.',31),
  ('landing','method_2_desc','Method step 2 body','textarea','Map your skills to the expensive problems employers actually pay to solve.',32),
  ('landing','method_3_title','Method step 3 title','text','Build proof.',33),
  ('landing','method_3_desc','Method step 3 body','textarea','Convert vague skills into believable evidence: skill + situation + result. Proof beats claim.',34),
  ('landing','method_4_title','Method step 4 title','text','Signal "operator."',35),
  ('landing','method_4_desc','Method step 4 body','textarea','Rebuild your résumé and LinkedIn so recruiters find you and read "operator," not "applicant."',36),
  ('landing','method_5_title','Method step 5 title','text','Run the system.',37),
  ('landing','method_5_desc','Method step 5 body','textarea','Your Mission Card, pipeline dashboard, and weekly reset — momentum protected by rhythm, not hope.',38),
  ('landing','get_heading','You-will-get heading','text','You Will Get',39),
  ('landing','get_1','You will get — item 1','text','Your one-sentence lane',40),
  ('landing','get_2','You will get — item 2','text','A pain-to-paycheck map of your skills',41),
  ('landing','get_3','You will get — item 3','text','The proof-bullet formula (skill + situation + result)',42),
  ('landing','get_4','You will get — item 4','text','Recruiter-ready résumé & LinkedIn fixes',43),
  ('landing','get_5','You will get — item 5','text','The Mission Card operating template',44),
  ('landing','bonus_heading','Bonus heading','text','The Bonus',45),
  ('landing','bonus_body','Bonus body','textarea','Register and you''ll get the JobHacker Mission Card — the one-page operating system that turns a chaotic job hunt into a disciplined campaign: daily non-negotiables, a pipeline dashboard, and a weekly reset.',46),
  ('landing','hero_quote','Hero quote','textarea','3 job offers in about 30 days… and a $60,000 raise! Hands down the best decision I''ve made.',47),
  ('landing','hero_quote_attr','Hero quote attribution','text','Bill Gibbs, Sales & Marketing Executive 🇺🇸',48),
  ('landing','event_date','Event date (fallback)','text','Wed 19 August 2026',49),
  ('landing','event_time','Event time (fallback)','text','9:00 AM NZST',50),
  ('landing','event_location','Event location','text','Online · Zoom',51),
  ('landing','biz_heading','Business-for-good heading','text','Business for Good',52),
  ('landing','biz_body','Business-for-good body','textarea','JobHackers exists to put clarity and confidence back in the hands of people the market overlooked. A share of every program goes toward helping job seekers who can''t yet afford support — because everyone deserves to be understood and chosen.',53),
  ('landing','action_statement_title','Take-action heading','text','The market changed the rules. Learn the new ones.',54),
  ('landing','action_statement','Take-action statement','textarea','Hope is not a strategy. Drift is not a strategy. Volume is not a strategy. Your next session starts soon.',55),
  ('landing','cta_label','Primary CTA label (all buttons)','text','Save My Seat',56),
  ('landing','register_title','Signup modal title','text','Save my seat',57),
  ('landing','video_url','Hero video URL','url','',58),
  ('quiz','intro','Quiz intro line','text','Please take 20 seconds to answer a few quick questions:',1),
  ('thankyou','title','Thank-you headline','text','You''re in! 🎉 Now watch this short video',1),
  ('thankyou','subtitle','Thank-you subheadline','textarea','Here''s how to get the most out of the workshop — complete the 3 quick steps below.',2),
  ('thankyou','video_url','Thank-you video URL','url','',3),
  ('thankyou','steps_title','Next steps title','text','Complete your next steps 👇',4)
on conflict (page, key) do nothing;

-- ---------- CTAs ----------
insert into ctas (page, slot, label, sublabel, url, icon, style, position) values
  ('thankyou','card_1','Add to your calendar','Lock in your seat so you don''t miss it','#','📅','primary',1),
  ('thankyou','card_2','Get the free JobHacking playbook','The 7-step done-for-you templates (PDF)','https://jobhackers.global','📘','primary',2),
  ('thankyou','card_3','Join the community','Meet other job hackers on Meetup','https://www.meetup.com/job-hackers-global/','🤝','primary',3),
  ('landing','primary','Save My Seat',null,'#register','→','primary',1)
on conflict (page, slot) do nothing;


-- ============================================================
-- Public RPCs for the funnel (SECURITY DEFINER).
-- Anon can record events WITHOUT direct table access and WITHOUT
-- any secret key in the browser. Each call writes one event row.
-- ============================================================

-- ---------- Score answers against quiz_options.score ----------
-- answers shape: { "<question_id>": ["<option_value>", ...], ... }
create or replace function compute_lead_score(p_answers jsonb)
returns int language sql stable as $$
  select coalesce(sum(o.score), 0)::int
  from quiz_options o
  join quiz_questions q on q.id = o.question_id and q.scored
  where exists (
    select 1 from jsonb_each(p_answers) a
    where a.key = o.question_id::text
      and o.value in (select jsonb_array_elements_text(a.value))
  );
$$;

-- ---------- Step 1: webinar RSVP -> ACQUISITION event ----------
-- tag e.g. 'EVENT->RSVP->WEBINAR-2026-06-25'
create or replace function register_lead(
  p_first_name text,
  p_last_name  text,
  p_email      text,
  p_tag        text,
  p_source     text default null,
  p_location   text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_source text;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'A valid email is required';
  end if;
  if p_first_name is null or length(trim(p_first_name)) = 0 then
    raise exception 'First name is required';
  end if;

  v_source := coalesce(nullif(trim(p_source), ''), 'direct');

  insert into jobhackers_leads (first_name, last_name, email, stage, tag, source, location)
  values (p_first_name, nullif(trim(p_last_name),''), lower(p_email),
          'acquisition', p_tag, v_source, nullif(trim(p_location),''))
  on conflict (email, tag, stage) do update
     set first_name = excluded.first_name,
         last_name  = coalesce(excluded.last_name, jobhackers_leads.last_name),
         source     = excluded.source,
         location   = coalesce(excluded.location, jobhackers_leads.location),
         updated_at = now()
  returning id into v_id;

  return v_id;
end; $$;

-- ---------- Step 2: quiz answer -> ACTIVATION event ----------
-- tag default 'EVENT->ANSWER->WEBINAR-QUIZ'
create or replace function complete_quiz(
  p_email   text,
  p_answers jsonb,
  p_source  text default null,
  p_tag     text default 'EVENT->ANSWER->WEBINAR-QUIZ'
) returns table (id uuid, score int)
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_score int; v_source text; v_first text; v_last text; v_loc text; v_arch text;
begin
  v_score  := compute_lead_score(p_answers);
  v_source := coalesce(nullif(trim(p_source), ''), 'direct');

  -- persona from the chosen option(s) that carry an archetype (e.g. Q3)
  select o.archetype into v_arch
  from quiz_options o
  where o.archetype is not null
    and exists (
      select 1 from jsonb_each(p_answers) a
      where a.key = o.question_id::text
        and o.value in (select jsonb_array_elements_text(a.value))
    )
  limit 1;

  -- carry the person's identity from their acquisition event (first_name is required)
  select first_name, last_name, location
    into v_first, v_last, v_loc
  from jobhackers_leads
  where email = lower(p_email) and stage = 'acquisition'
  order by created_at desc limit 1;

  insert into jobhackers_leads (first_name, last_name, email, stage, tag, source, score, archetype, location)
  values (coalesce(v_first, 'Friend'), v_last, lower(p_email),
          'activation', p_tag, v_source, v_score, v_arch, v_loc)
  on conflict (email, tag, stage) do update
     set score      = excluded.score,
         source     = excluded.source,
         archetype  = excluded.archetype,
         updated_at = now()
  returning jobhackers_leads.id into v_id;

  return query select v_id, v_score;
end; $$;

grant execute on function compute_lead_score(jsonb) to anon, authenticated;
grant execute on function register_lead(text,text,text,text,text,text) to anon, authenticated;
grant execute on function complete_quiz(text,jsonb,text,text) to anon, authenticated;


-- ============================================================
-- Admin allowlist. Only these emails can read leads / write CMS.
-- Idempotent.
-- ============================================================

create table if not exists public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

insert into public.admins (email) values
  ('rafael@digitalpathways.io'),
  ('laurent@digitalpathways.io')
on conflict (email) do nothing;

-- is the current authenticated user an allow-listed admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = (auth.jwt() ->> 'email'));
$$;
grant execute on function public.is_admin() to authenticated;

alter table public.admins enable row level security;
drop policy if exists "admins readable" on public.admins;
create policy "admins readable" on public.admins for select to authenticated using (true);
drop policy if exists "admins manageable" on public.admins;
create policy "admins manageable" on public.admins for all to authenticated using (is_admin()) with check (is_admin());

-- ---- Tighten existing policies: authenticated -> admins only ----
drop policy if exists "admin write content" on content_blocks;
create policy "admin write content" on content_blocks for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin write ctas" on ctas;
create policy "admin write ctas" on ctas for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin write q" on quiz_questions;
create policy "admin write q" on quiz_questions for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin write opts" on quiz_options;
create policy "admin write opts" on quiz_options for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin write events" on webinar_events;
create policy "admin write events" on webinar_events for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin read leads" on public.jobhackers_leads;
create policy "admin read leads" on public.jobhackers_leads for select to authenticated using (is_admin());

drop policy if exists "admin write leads" on public.jobhackers_leads;
create policy "admin write leads" on public.jobhackers_leads for all to authenticated using (is_admin()) with check (is_admin());


-- ============================================================
-- Hero media (video|image), phone capture, and form content.
-- Idempotent.
-- ============================================================

-- phone on leads
alter table public.jobhackers_leads add column if not exists phone text;

-- register_lead now also captures phone
drop function if exists register_lead(text,text,text,text,text,text);
drop function if exists register_lead(text,text,text,text,text,text,text);
create or replace function register_lead(
  p_first_name text,
  p_last_name  text,
  p_email      text,
  p_tag        text,
  p_source     text default null,
  p_location   text default null,
  p_phone      text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_source text;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'A valid email is required';
  end if;
  if p_first_name is null or length(trim(p_first_name)) = 0 then
    raise exception 'First name is required';
  end if;

  v_source := coalesce(nullif(trim(p_source), ''), 'direct');

  insert into jobhackers_leads (first_name, last_name, email, stage, tag, source, location, phone)
  values (p_first_name, nullif(trim(p_last_name),''), lower(p_email),
          'acquisition', p_tag, v_source, nullif(trim(p_location),''), nullif(trim(p_phone),''))
  on conflict (email, tag, stage) do update
     set first_name = excluded.first_name,
         last_name  = coalesce(excluded.last_name, jobhackers_leads.last_name),
         source     = excluded.source,
         location   = coalesce(excluded.location, jobhackers_leads.location),
         phone      = coalesce(excluded.phone, jobhackers_leads.phone),
         updated_at = now()
  returning id into v_id;

  return v_id;
end; $$;
grant execute on function register_lead(text,text,text,text,text,text,text) to anon, authenticated;

-- content: hero media + form copy + disclaimer
insert into content_blocks (page, key, label, type, value, position) values
  ('landing','hero_media_type','Hero media type (video|image)','text','video',100),
  ('landing','hero_media_url','Hero media URL (video or image)','url','',101),
  ('landing','form_heading','Registration card heading','text','Seats are limited. Secure yours now.',102),
  ('landing','form_button','Registration button label','text','Register Now',103),
  ('landing','register_disclaimer','Registration disclaimer','textarea','By opting in, you agree to receive logistics and marketing communications about this event via email and SMS, as well as occasional marketing messages via SMS and WhatsApp. Standard rates may apply. You can opt out at any time by replying STOP to SMS or WhatsApp messages.',104),
  ('thankyou','hero_media_type','Hero media type (video|image)','text','video',100),
  ('thankyou','hero_media_url','Hero media URL (video or image)','url','',101)
on conflict (page, key) do nothing;


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




-- ============================================================
-- 0007: A/B layout test (appended)
-- ============================================================
-- ============================================================
-- A/B layout test: experiment config, exposure counts, per-variant
-- lead attribution. Variant A = existing layout, Variant B = the
-- masterclass-style layout. Idempotent.
-- ============================================================

-- ---------- 1. Experiment config (single row, key = 'landing') ----------
create table if not exists public.experiments (
  key               text primary key,
  enabled           boolean not null default false,
  weight_a          int     not null default 50 check (weight_a >= 0),
  weight_b          int     not null default 50 check (weight_b >= 0),
  updated_at        timestamptz not null default now()
);
drop trigger if exists experiments_updated on public.experiments;
create trigger experiments_updated before update on public.experiments
  for each row execute function set_updated_at();

insert into public.experiments (key, enabled, weight_a, weight_b)
values ('landing', false, 50, 50)
on conflict (key) do nothing;

-- ---------- 2. Exposure counters (impressions per variant) ----------
create table if not exists public.ab_exposures (
  experiment  text not null,
  variant     text not null,
  count       bigint not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (experiment, variant)
);

-- public, key-less increment via SECURITY DEFINER (no table grant to anon)
create or replace function public.record_ab_exposure(p_experiment text, p_variant text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_variant is null or p_variant not in ('a','b') then return; end if;
  insert into ab_exposures (experiment, variant, count)
  values (coalesce(nullif(trim(p_experiment),''),'landing'), p_variant, 1)
  on conflict (experiment, variant)
  do update set count = ab_exposures.count + 1, updated_at = now();
end; $$;
grant execute on function public.record_ab_exposure(text,text) to anon, authenticated;

-- ---------- 3. Variant attribution on leads ----------
alter table public.jobhackers_leads add column if not exists variant text;

-- register_lead, now carrying the assigned variant
drop function if exists register_lead(text,text,text,text,text,text);
drop function if exists register_lead(text,text,text,text,text,text,text);
drop function if exists register_lead(text,text,text,text,text,text,text,text);
create or replace function register_lead(
  p_first_name text,
  p_last_name  text,
  p_email      text,
  p_tag        text,
  p_source     text default null,
  p_location   text default null,
  p_phone      text default null,
  p_variant    text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_source text;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'A valid email is required';
  end if;
  if p_first_name is null or length(trim(p_first_name)) = 0 then
    raise exception 'First name is required';
  end if;

  v_source := coalesce(nullif(trim(p_source), ''), 'direct');

  insert into jobhackers_leads (first_name, last_name, email, stage, tag, source, location, phone, variant)
  values (p_first_name, nullif(trim(p_last_name),''), lower(p_email),
          'acquisition', p_tag, v_source, nullif(trim(p_location),''),
          nullif(trim(p_phone),''), nullif(trim(p_variant),''))
  on conflict (email, tag, stage) do update
     set first_name = excluded.first_name,
         last_name  = coalesce(excluded.last_name, jobhackers_leads.last_name),
         source     = excluded.source,
         location   = coalesce(excluded.location, jobhackers_leads.location),
         phone      = coalesce(excluded.phone, jobhackers_leads.phone),
         variant    = coalesce(excluded.variant, jobhackers_leads.variant),
         updated_at = now()
  returning id into v_id;

  return v_id;
end; $$;
grant execute on function register_lead(text,text,text,text,text,text,text,text) to anon, authenticated;

-- ---------- 4. RLS ----------
alter table public.experiments  enable row level security;
alter table public.ab_exposures enable row level security;

drop policy if exists "public read experiments" on public.experiments;
create policy "public read experiments" on public.experiments for select using (true);
drop policy if exists "admin write experiments" on public.experiments;
create policy "admin write experiments" on public.experiments
  for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "public read exposures" on public.ab_exposures;
create policy "public read exposures" on public.ab_exposures for select using (true);
drop policy if exists "admin write exposures" on public.ab_exposures;
create policy "admin write exposures" on public.ab_exposures
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---------- 5. Seed Variant B content (page = 'landing_b') ----------
-- Masterclass layout, adapted to the JobHackers "New Rules" angle.
insert into public.content_blocks (page, key, label, type, value, position) values
  ('landing_b','badge','Top badge','text','FREE LIVE MASTERCLASS',10),
  ('landing_b','hero_title','Hero headline','text','You Did Everything Right. The Rules of Getting Hired Changed Anyway.',11),
  ('landing_b','hero_title_accent','Hero headline (accent tail)','text','Here Are the New Ones.',12),
  ('landing_b','hero_subtitle','Hero subheadline','textarea','In this free 60-minute masterclass, David Perry & Laurent Simon show you how to get clear, build proof, and get chosen — even in a market flooded by AI résumés and ghosted applications.',13),
  ('landing_b','cta_label','CTA button label','text','Claim Your Free Seat',14),
  ('landing_b','countdown_label','Countdown label','text','Next masterclass begins in',15),
  ('landing_b','proof_strip','Proof strip (· separated)','text','2,000+ professionals trained · David Perry & Laurent Simon · 60-minute live session',16),

  ('landing_b','learn_heading','"What you''ll learn" heading','text','Here''s what you''re going to get out of this (free) masterclass…',20),
  ('landing_b','part_1_kicker','Part 1 kicker','text','PART 01',21),
  ('landing_b','part_1_title','Part 1 title','text','Find Your Lane (The One-Sentence Fix)',22),
  ('landing_b','part_1_desc','Part 1 description','textarea','We''ll help you state what you do in one sentence the market instantly understands — so you stop getting filtered out, undervalued, or ignored.',23),
  ('landing_b','part_2_kicker','Part 2 kicker','text','PART 02',24),
  ('landing_b','part_2_title','Part 2 title','text','Follow the Pain to the Paycheck',25),
  ('landing_b','part_2_desc','Part 2 description','textarea','The 1 positioning shift that maps your experience to the expensive problems employers actually pay to solve — and lands you interviews in days, not months.',26),
  ('landing_b','part_3_kicker','Part 3 kicker','text','PART 03',27),
  ('landing_b','part_3_title','Part 3 title','text','Build Proof, Signal "Operator"',28),
  ('landing_b','part_3_desc','Part 3 description','textarea','Convert vague skills into believable evidence and rebuild your résumé + LinkedIn so recruiters read "operator," not "applicant."',29),
  ('landing_b','bonus_kicker','Bonus kicker','text','LIVE BONUS',30),
  ('landing_b','bonus_title','Bonus title','text','The JobHacker Mission Card',31),
  ('landing_b','bonus_desc','Bonus description','textarea','Show up live and you''ll walk away with the one-page operating system that turns a chaotic job hunt into a disciplined campaign: daily non-negotiables, a pipeline dashboard, and a weekly reset.',32),

  ('landing_b','presenters_heading','Presenters heading','text','Your Masterclass Hosts',40),
  ('landing_b','closer_heading','Closing heading','text','Don''t miss this free masterclass.',50),
  ('landing_b','closer_sub','Closing subline','textarea','60 minutes that could change your career. Pick the session that suits you — it runs every fortnight.',51),

  ('landing_b','form_heading','Registration card heading','text','Seats are limited. Secure yours now.',60),
  ('landing_b','form_button','Registration button label','text','Claim Your Free Seat',61),
  ('landing_b','register_disclaimer','Registration disclaimer','textarea','By opting in, you agree to receive logistics and marketing communications about this event via email and SMS, as well as occasional marketing messages via SMS and WhatsApp. Standard rates may apply. You can opt out at any time by replying STOP.',62),
  ('landing_b','hero_media_type','Hero media type (video|image)','text','video',63),
  ('landing_b','hero_media_url','Hero media URL','url','',64)
on conflict (page, key) do nothing;
