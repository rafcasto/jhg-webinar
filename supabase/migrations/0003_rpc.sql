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
