-- ============================================================
-- Compass quiz (metadata-driven scoring) + Referral engine.
--
-- Flow change:
--   landing → register → /registered (lead-magnet gate) → /quiz (Compass)
--            → /referral (share-to-win a mentor call)
--
-- 1. Quiz option metadata: readiness / fit_gate / obstacle / flag / is_other
--    so scoring is derived from the SELECTED options, never a question's
--    position — admins can reorder / rename / add / remove questions freely.
-- 2. Compass scoring: archetype + readiness(0–6) + heat + fit(gate) + grade
--    (A–E matrix) + obstacle + flags.
-- 3. Referral: opaque per-person code, REFERRAL-stage attribution rows, a
--    configurable target, and a winners ledger.
-- Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Quiz option metadata + question type/required
-- ------------------------------------------------------------
alter table public.quiz_options add column if not exists readiness int not null default 0;
alter table public.quiz_options add column if not exists fit_gate  text;      -- 'qualified' | 'below-icp'
alter table public.quiz_options add column if not exists obstacle  text;      -- Q3 routing label
alter table public.quiz_options add column if not exists flag      text;      -- ai-anxious | vip-signal | below-icp | manual-review
alter table public.quiz_options add column if not exists is_other  boolean not null default false;

-- quiz_questions.type already exists ('single' | 'multi'); allow 'text' for the
-- optional open-text question. `required` lets Q6 be optional.
alter table public.quiz_questions add column if not exists required boolean not null default true;

-- ------------------------------------------------------------
-- 2. Lead columns for the Compass result
-- ------------------------------------------------------------
alter table public.jobhackers_leads add column if not exists grade        text;
alter table public.jobhackers_leads add column if not exists obstacle     text;
alter table public.jobhackers_leads add column if not exists quiz_answers jsonb;
alter table public.jobhackers_leads add column if not exists referred_by  text;   -- referrer email (REFERRAL rows)
create index if not exists idx_jobhackers_leads_referred_by on public.jobhackers_leads (referred_by);

-- ------------------------------------------------------------
-- 3. Compass scoring engine (metadata-driven)
--    answers shape: { "<question_id>": ["<option_value>", ...], ... }
-- ------------------------------------------------------------
create or replace function public.compute_compass(p_answers jsonb)
returns table (
  archetype text,
  readiness int,
  heat      text,
  fit       text,
  grade     text,
  obstacle  text,
  flags     text[]
)
language sql stable as $$
  with sel as (
    select o.*
    from quiz_options o
    where exists (
      select 1 from jsonb_each(p_answers) a
      where a.key = o.question_id::text
        and o.value in (select jsonb_array_elements_text(a.value))
    )
  ),
  agg as (
    select
      coalesce(sum(s.readiness), 0)::int                                           as readiness,
      (array_agg(s.archetype) filter (where nullif(s.archetype,'') is not null))[1] as archetype,
      (array_agg(s.obstacle)  filter (where nullif(s.obstacle,'')  is not null))[1] as obstacle,
      bool_or(coalesce(s.fit_gate,'') = 'below-icp')                               as is_below,
      bool_or(coalesce(s.is_other, false))                                         as has_other,
      array_remove(array_agg(distinct nullif(s.flag,'')), null)                    as raw_flags
    from sel s
  )
  select
    coalesce(a.archetype, 'Unclassified') as archetype,
    a.readiness,
    case when a.readiness >= 5 then 'hot'
         when a.readiness >= 3 then 'warm'
         else 'cool' end                  as heat,
    case when a.is_below then 'below-icp' else 'qualified' end as fit,
    case
      when not a.is_below and a.readiness >= 5 then 'A'
      when not a.is_below and a.readiness >= 3 then 'B'
      when not a.is_below                       then 'C'
      when a.is_below and a.readiness >= 3       then 'D'
      else 'E'
    end                                   as grade,
    a.obstacle,
    ( select coalesce(array_agg(distinct f), '{}')
      from unnest(
        a.raw_flags
        || case when a.is_below  then array['below-icp']    else '{}'::text[] end
        || case when a.has_other then array['manual-review'] else '{}'::text[] end
      ) as f
    )                                     as flags
  from agg a;
$$;

-- ------------------------------------------------------------
-- 4. complete_quiz — records the ACTIVATION event with the full Compass result.
--    Default tag EVENT->QUIZ_COMPLETE->TRACKER (admin-overridable).
-- ------------------------------------------------------------
drop function if exists public.complete_quiz(text, jsonb, text, text);
create or replace function public.complete_quiz(
  p_email   text,
  p_answers jsonb,
  p_source  text  default null,
  p_tag     text  default 'EVENT->QUIZ_COMPLETE->TRACKER',
  p_other   jsonb default '{}'::jsonb,
  p_q6      text  default null
) returns table (id uuid, score int, grade text, archetype text)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_source text;
  v_first text; v_last text; v_loc text;
  r record;
begin
  v_source := coalesce(nullif(trim(p_source), ''), 'direct');
  select * into r from compute_compass(p_answers);

  -- carry identity from the acquisition event (first_name is required on leads)
  select first_name, last_name, location
    into v_first, v_last, v_loc
  from jobhackers_leads
  where email = lower(p_email) and stage = 'acquisition'
  order by created_at desc limit 1;

  insert into jobhackers_leads (
    first_name, last_name, email, stage, tag, source,
    score, archetype, grade, obstacle, location, quiz_answers
  )
  values (
    coalesce(v_first, 'Friend'), v_last, lower(p_email), 'activation', p_tag, v_source,
    r.readiness, r.archetype, r.grade, r.obstacle, v_loc,
    jsonb_build_object(
      'answers',   p_answers,
      'other',     coalesce(p_other, '{}'::jsonb),
      'q6',        p_q6,
      'flags',     to_jsonb(r.flags),
      'heat',      r.heat,
      'fit',       r.fit,
      'readiness', r.readiness
    )
  )
  on conflict (email, tag, stage) do update
    set score        = excluded.score,
        source       = excluded.source,
        archetype    = excluded.archetype,
        grade        = excluded.grade,
        obstacle     = excluded.obstacle,
        quiz_answers = excluded.quiz_answers,
        updated_at   = now()
  returning jobhackers_leads.id into v_id;

  return query select v_id, r.readiness, r.grade, r.archetype;
end; $$;

-- ------------------------------------------------------------
-- 5. Referral engine
-- ------------------------------------------------------------

-- Opaque per-person referral code (never exposes the referrer's email in a URL).
create table if not exists public.referral_codes (
  code       text primary key,
  email      text not null unique,
  created_at timestamptz not null default now()
);
alter table public.referral_codes enable row level security;
drop policy if exists "admin read refcodes" on public.referral_codes;
create policy "admin read refcodes" on public.referral_codes
  for select to authenticated using (true);

-- Winners ledger — everyone who hit the referral target (wins the mentor call).
create table if not exists public.referral_winners (
  email          text primary key,
  first_name     text,
  referral_count int  not null default 0,
  target         int  not null default 0,
  won_at         timestamptz not null default now()
);
alter table public.referral_winners enable row level security;
drop policy if exists "admin read winners" on public.referral_winners;
create policy "admin read winners" on public.referral_winners
  for select to authenticated using (true);

-- The configured target lives in content_blocks (page 'referral') so it is
-- editable from the admin Thank-you tab. This helper reads it, default 15.
create or replace function public.referral_target()
returns int language sql stable as $$
  select coalesce(
    (select nullif(regexp_replace(value, '\D', '', 'g'), '')::int
       from content_blocks where page = 'referral' and key = 'referral_target' limit 1),
    15
  );
$$;

-- Ensure (and return) a stable opaque code for an email.
create or replace function public.ensure_referral_code(p_email text)
returns text
language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'A valid email is required';
  end if;

  select code into v_code from referral_codes where email = lower(p_email);
  if v_code is not null then return v_code; end if;

  loop
    -- Core functions only (no pgcrypto): avoids the extensions-schema search_path issue.
    v_code := substr(md5(random()::text || clock_timestamp()::text || coalesce(p_email,'')), 1, 8);
    begin
      insert into referral_codes (code, email) values (v_code, lower(p_email));
      return v_code;
    exception when unique_violation then
      -- code collided (or email raced) — retry / re-read
      select code into v_code from referral_codes where email = lower(p_email);
      if v_code is not null then return v_code; end if;
    end;
  end loop;
end; $$;

-- Record a referral: a new registrant arrived via someone's ?ref= code.
-- Writes a REFERRAL-stage attribution row and, if the referrer crossed the
-- target, records them in the winners ledger. Returns crossing info.
create or replace function public.record_referral(
  p_new_email text,
  p_ref_code  text
) returns table (referrer_email text, referral_count int, target int, newly_won boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_ref_email text;
  v_new_first text;
  v_tag       text;
  v_count     int;
  v_target    int;
  v_was_winner boolean;
begin
  if p_new_email is null or position('@' in p_new_email) = 0 then
    raise exception 'A valid email is required';
  end if;

  select email into v_ref_email from referral_codes where code = lower(trim(p_ref_code));
  -- Unknown code or self-referral → no-op (still let the person register normally).
  if v_ref_email is null or v_ref_email = lower(p_new_email) then
    return;
  end if;

  select first_name into v_new_first
  from jobhackers_leads
  where email = lower(p_new_email) and stage = 'acquisition'
  order by created_at desc limit 1;

  -- EVENT->[NEW_REGISTERED_EMAIL]->JOIN_WEBINAR->BY->REFERRAL->[REFERRAL_EMAIL]
  v_tag := 'EVENT->' || lower(p_new_email) || '->JOIN_WEBINAR->BY->REFERRAL->' || v_ref_email;

  insert into jobhackers_leads (first_name, email, stage, tag, source, referred_by)
  values (coalesce(v_new_first, 'Friend'), lower(p_new_email), 'referral', v_tag, 'referral', v_ref_email)
  on conflict (email, tag, stage) do update set updated_at = now();

  select count(distinct email) into v_count
  from jobhackers_leads where stage = 'referral' and referred_by = v_ref_email;

  v_target := referral_target();

  select exists(select 1 from referral_winners where email = v_ref_email) into v_was_winner;

  if v_count >= v_target and not v_was_winner then
    insert into referral_winners (email, first_name, referral_count, target)
    select v_ref_email, l.first_name, v_count, v_target
    from jobhackers_leads l
    where l.email = v_ref_email and l.stage = 'acquisition'
    order by l.created_at desc limit 1
    on conflict (email) do nothing;
  elsif v_was_winner then
    update referral_winners set referral_count = v_count where email = v_ref_email;
  end if;

  return query select v_ref_email, v_count, v_target, (v_count >= v_target and not v_was_winner);
end; $$;

-- Progress for the share page (the freshly-registered person's own tally).
create or replace function public.get_referral_progress(p_email text)
returns table (code text, referral_count int, target int, won boolean)
language plpgsql security definer set search_path = public as $$
declare v_code text; v_count int; v_target int;
begin
  v_code   := ensure_referral_code(p_email);
  v_target := referral_target();
  select count(distinct email) into v_count
  from jobhackers_leads where stage = 'referral' and referred_by = lower(p_email);
  return query
    select v_code, v_count, v_target,
           (v_count >= v_target or exists(select 1 from referral_winners w where w.email = lower(p_email)));
end; $$;

-- ------------------------------------------------------------
-- Grants (anon runs the public funnel RPCs; no table access, no secrets)
-- ------------------------------------------------------------
grant execute on function public.compute_compass(jsonb)                 to anon, authenticated;
grant execute on function public.complete_quiz(text,jsonb,text,text,jsonb,text) to anon, authenticated;
grant execute on function public.referral_target()                      to anon, authenticated;
grant execute on function public.ensure_referral_code(text)             to anon, authenticated;
grant execute on function public.record_referral(text,text)             to anon, authenticated;
grant execute on function public.get_referral_progress(text)            to anon, authenticated;
