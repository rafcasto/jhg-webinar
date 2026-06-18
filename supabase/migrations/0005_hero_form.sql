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
