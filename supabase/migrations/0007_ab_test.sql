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
