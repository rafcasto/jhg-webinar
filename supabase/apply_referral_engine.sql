-- ============================================================
-- Referral engine repair (idempotent, standalone).
--
-- Production was missing the referral engine from migration
-- 0010_compass_referral.sql — get_referral_progress() did not exist, so the
-- /referral page could never generate a share code and the invite link came
-- back empty. This script (re)creates ONLY the referral pieces + seeds the
-- /referral page content. Safe to run multiple times; it never overwrites
-- content copy you've already edited in the admin.
--
-- Run in the Supabase SQL editor (No limit).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Column the referral rows need on the lead log
-- ------------------------------------------------------------
alter table public.jobhackers_leads add column if not exists referred_by text; -- referrer email
create index if not exists idx_jobhackers_leads_referred_by on public.jobhackers_leads (referred_by);

-- ------------------------------------------------------------
-- 2. Tables: opaque per-person code + winners ledger
-- ------------------------------------------------------------
create table if not exists public.referral_codes (
  code       text primary key,
  email      text not null unique,
  created_at timestamptz not null default now()
);
alter table public.referral_codes enable row level security;
drop policy if exists "admin read refcodes" on public.referral_codes;
create policy "admin read refcodes" on public.referral_codes
  for select to authenticated using (true);

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

-- ------------------------------------------------------------
-- 3. Functions
-- ------------------------------------------------------------

-- Configured target lives in content_blocks (page 'referral'); default 15.
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
    v_code := lower(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    begin
      insert into referral_codes (code, email) values (v_code, lower(p_email));
      return v_code;
    exception when unique_violation then
      select code into v_code from referral_codes where email = lower(p_email);
      if v_code is not null then return v_code; end if;
    end;
  end loop;
end; $$;

-- Record a referral (a new registrant arrived via someone's ?ref= code).
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
  if v_ref_email is null or v_ref_email = lower(p_new_email) then
    return;
  end if;

  select first_name into v_new_first
  from jobhackers_leads
  where email = lower(p_new_email) and stage = 'acquisition'
  order by created_at desc limit 1;

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

-- Progress for the share page (the freshly-registered person's own tally + code).
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
-- 4. Grants (anon runs the public funnel RPCs)
-- ------------------------------------------------------------
grant execute on function public.referral_target()          to anon, authenticated;
grant execute on function public.ensure_referral_code(text) to anon, authenticated;
grant execute on function public.record_referral(text,text) to anon, authenticated;
grant execute on function public.get_referral_progress(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 5. Seed /referral page content (only inserts missing keys; never overwrites)
-- ------------------------------------------------------------
insert into content_blocks (page, key, label, type, value, position) values
  ('referral','eyebrow','Eyebrow','text','ALL DONE 🎉',1),
  ('referral','title','Headline','text','Your 5 Prompts Are On Their Way.',2),
  ('referral','subtitle','Subheadline','textarea','Check your inbox in the next few minutes for your copy-paste prompt playbook. While you wait — here''s how to unlock a free 1-to-1 call with a JobHackers mentor.',3),
  ('referral','reward_title','Reward heading','text','Refer friends. Win a 30-minute mentor call.',4),
  ('referral','reward_body','Reward body','textarea','Share your invite link (or the templated email) with people who''d benefit. When enough of them register for the MasterClass, you earn a private 30-minute call with one of our Global mentors.',5),
  ('referral','referral_target','Referrals needed to win the call','text','15',7),
  ('referral','success_title','Winner banner title','text','🎉 You did it — your mentor call is unlocked!',9),
  ('referral','success_body','Winner banner body','textarea','Keep an eye on your inbox — we''ll email you a link to book your free 30-minute call with a JobHackers mentor.',10),
  ('referral','cta_label','LinkedIn share button label','text','Share on LinkedIn →',11)
on conflict (page, key) do nothing;

-- ------------------------------------------------------------
-- 6. Sanity check — should return one row with a non-null code.
-- ------------------------------------------------------------
-- select * from get_referral_progress('test@example.com');
