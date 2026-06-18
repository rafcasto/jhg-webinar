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
