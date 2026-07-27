-- ============================================================
-- REPLACE QUIZ with the Compass format (Q1–Q6).
-- Safe to run repeatedly. FORCE-replaces the quiz every run
-- (deletes existing questions, then reseeds the new set).
--
-- Run in the Supabase SQL Editor, or:
--   psql "$DATABASE_URL" -f supabase/replace_quiz.sql
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Ensure metadata columns exist (no-ops if already present)
-- ------------------------------------------------------------
alter table public.quiz_options   add column if not exists readiness int  not null default 0;
alter table public.quiz_options   add column if not exists fit_gate  text;   -- 'qualified' | 'below-icp'
alter table public.quiz_options   add column if not exists obstacle  text;   -- Q3 routing label
alter table public.quiz_options   add column if not exists flag      text;   -- ai-anxious | vip-signal | below-icp | manual-review
alter table public.quiz_options   add column if not exists is_other  boolean not null default false;
alter table public.quiz_questions add column if not exists required  boolean not null default true;

alter table public.jobhackers_leads add column if not exists grade        text;
alter table public.jobhackers_leads add column if not exists obstacle     text;
alter table public.jobhackers_leads add column if not exists quiz_answers jsonb;

-- ------------------------------------------------------------
-- 2. Scoring engine (metadata-driven) + complete_quiz RPC
--    Safe create-or-replace; drops the legacy 4-arg signature.
-- ------------------------------------------------------------
create or replace function public.compute_compass(p_answers jsonb)
returns table (
  archetype text, readiness int, heat text, fit text,
  grade text, obstacle text, flags text[]
) language sql stable as $$
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
      coalesce(sum(s.readiness), 0)::int                                            as readiness,
      (array_agg(s.archetype) filter (where nullif(s.archetype,'') is not null))[1] as archetype,
      (array_agg(s.obstacle)  filter (where nullif(s.obstacle,'')  is not null))[1] as obstacle,
      bool_or(coalesce(s.fit_gate,'') = 'below-icp')                                as is_below,
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
        || case when a.is_below  then array['below-icp']     else '{}'::text[] end
        || case when a.has_other then array['manual-review'] else '{}'::text[] end
      ) as f
    )                                     as flags
  from agg a;
$$;

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
declare v_id uuid; v_source text; v_first text; v_last text; v_loc text; r record;
begin
  v_source := coalesce(nullif(trim(p_source), ''), 'direct');
  select * into r from compute_compass(p_answers);

  select first_name, last_name, location into v_first, v_last, v_loc
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
    set score = excluded.score, source = excluded.source,
        archetype = excluded.archetype, grade = excluded.grade,
        obstacle = excluded.obstacle, quiz_answers = excluded.quiz_answers,
        updated_at = now()
  returning jobhackers_leads.id into v_id;

  return query select v_id, r.readiness, r.grade, r.archetype;
end; $$;

grant execute on function public.compute_compass(jsonb)                          to anon, authenticated;
grant execute on function public.complete_quiz(text,jsonb,text,text,jsonb,text)  to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Force-replace the quiz content (Q1–Q6)
--    delete cascades to quiz_options via FK on delete cascade.
-- ------------------------------------------------------------
delete from quiz_questions;

-- Q1 — archetype
with q as (
  insert into quiz_questions (position, prompt, help_text, type, scored, required, enabled)
  values (1, 'What best describes you right now?',
          'Two minutes. Your answers tailor the MasterClass to your situation.',
          'single', false, true, true)
  returning id
)
insert into quiz_options (question_id, position, label, value, archetype, flag, is_other)
select id, p, l, v, a, f, o from q,
  (values
    (1,'Lost my job, need one fast','lost_job','Job Seeker',null,false),
    (2,'Employed, want a promotion/raise','promotion','Promotion Seeker',null,false),
    (3,'Employed but in the wrong role, want to change direction','wrong_role','Career Changer',null,false),
    (4,'Worried AI will disrupt my career','ai_worried','Career Changer','ai-anxious',false),
    (5,'Something else','other','Unclassified',null,true)
  ) as o(p,l,v,a,f,o);

-- Q2 — readiness (timeline)
with q as (
  insert into quiz_questions (position, prompt, type, scored, required, enabled)
  values (2, 'When do you want to be in your new (or next) role?', 'single', true, true, true)
  returning id
)
insert into quiz_options (question_id, position, label, value, readiness)
select id, p, l, v, r from q,
  (values
    (1,'Within 60 days or sooner','lt_60',3),
    (2,'2–3 months','2_3mo',2),
    (3,'4–6 months','4_6mo',1),
    (4,'Just exploring, no timeline','exploring',0)
  ) as o(p,l,v,r);

-- Q3 — obstacle (routing, not scored)
with q as (
  insert into quiz_questions (position, prompt, type, scored, required, enabled)
  values (3, 'Where are you getting stuck?', 'single', false, true, true)
  returning id
)
insert into quiz_options (question_id, position, label, value, obstacle, is_other)
select id, p, l, v, ob, o from q,
  (values
    (1,'Showcasing my value','value','value',false),
    (2,'Getting referrals','referrals','referrals',false),
    (3,'Getting interviews','interviews','interviews',false),
    (4,'Negotiating compensation','negotiation','negotiation',false),
    (5,'Something else','other','other',true)
  ) as o(p,l,v,ob,o);

-- Q4 — fit gate (years of experience)
with q as (
  insert into quiz_questions (position, prompt, type, scored, required, enabled)
  values (4, 'How many years of professional experience do you have?', 'single', false, true, true)
  returning id
)
insert into quiz_options (question_id, position, label, value, fit_gate, flag)
select id, p, l, v, fg, f from q,
  (values
    (1,'Under 3','under_3','below-icp','below-icp'),
    (2,'3–5','3_5','qualified',null),
    (3,'5–10','5_10','qualified',null),
    (4,'10–15','10_15','qualified',null),
    (5,'15+','15_plus','qualified',null)
  ) as o(p,l,v,fg,f);

-- Q5 — readiness (what they've already done)
with q as (
  insert into quiz_questions (position, prompt, type, scored, required, enabled)
  values (5, 'What have you already done about it?', 'single', true, true, true)
  returning id
)
insert into quiz_options (question_id, position, label, value, readiness, flag)
select id, p, l, v, r, f from q,
  (values
    (1,'Paid for a Job Hunting course before','paid_course',3,null),
    (2,'Paid for a Job Hunting coach / Outplacement before','paid_coach',3,'vip-signal'),
    (3,'Lots of DIY effort, no results','diy',2,null),
    (4,'A few small tweaks','tweaks',1,null),
    (5,'Nothing yet','nothing',0,null)
  ) as o(p,l,v,r,f);

-- Q6 — open text (optional, not scored)
insert into quiz_questions (position, prompt, help_text, type, scored, required, enabled)
values (6, 'Anything else you want us to know?', 'Optional — one sentence is plenty.', 'text', false, false, true);

commit;

-- Quick verification (run after commit):
-- select q.position, q.prompt, count(o.*) as options
--   from quiz_questions q left join quiz_options o on o.question_id = q.id
--   where q.enabled group by 1,2 order by 1;
