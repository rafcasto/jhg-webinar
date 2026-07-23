-- ============================================================
-- Weekly automation: keep Kit's reminder broadcasts in sync with Zoom.
--
-- Two staggered jobs run every WEDNESDAY (once a week):
--   00:00 UTC  zoom-sync            → refresh webinar_events from Zoom
--   00:30 UTC  countdown-broadcasts → schedule reminder broadcasts in Kit
--                                      for any new occurrence (publish=1, no reset)
--
-- The 30-minute gap guarantees zoom-sync finishes before the broadcasts job
-- reads the events (pg_net is fire-and-forget, so they must be separate jobs).
--
-- Run ONCE in the Supabase SQL editor. Idempotent (safe to re-run).
-- Replace <PUBLISHABLE_KEY> with your Supabase publishable/anon key
-- (Settings → API → Publishable key, a.k.a. VITE_SUPABASE_PUBLISHABLE_KEY).
--
-- NOTE: the cron only SCHEDULES the broadcasts. Kit sends each one later, at its
-- send_at, to whoever holds that event's EVENT->RSVP->WEBINAR-<date> tag then.
--
-- Change the weekly slot by editing the cron expressions:
--   '<min> <hour> * * <dow>'   dow: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any prior versions of these jobs (idempotent)
select cron.unschedule(jobid)
from cron.job
where jobname in ('zoom-sync-postmeeting', 'countdown-weekly');

-- 1) Refresh events from Zoom — Wednesdays 00:00 UTC
select cron.schedule('zoom-sync-postmeeting', '0 0 * * 3', $$
  select net.http_post(
    url     := 'https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/zoom-sync',
    headers := '{"Content-Type":"application/json","apikey":"<PUBLISHABLE_KEY>"}'::jsonb,
    body    := '{}'::jsonb
  );
$$);

-- 2) Schedule reminder broadcasts in Kit — Wednesdays 00:30 UTC
--    publish=1 sets each broadcast's send_at; NO reset, so existing broadcasts
--    are left untouched and only new occurrences get built.
select cron.schedule('countdown-weekly', '30 0 * * 3', $$
  select net.http_post(
    url     := 'https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/countdown-broadcasts?publish=1',
    headers := '{"Content-Type":"application/json","apikey":"<PUBLISHABLE_KEY>"}'::jsonb,
    body    := '{}'::jsonb
  );
$$);

-- Verify both jobs exist and are active
select jobname, schedule, active
from cron.job
where jobname in ('zoom-sync-postmeeting', 'countdown-weekly')
order by jobname;

-- ------------------------------------------------------------
-- FIRST-TIME GO-LIVE (run manually once, AFTER deploying the functions):
--   Rebuild + schedule the current occurrences from scratch.
--
--   select net.http_post(
--     url     := 'https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/countdown-broadcasts?reset=1&publish=1',
--     headers := '{"Content-Type":"application/json","apikey":"<PUBLISHABLE_KEY>"}'::jsonb,
--     body    := '{}'::jsonb
--   );
-- ------------------------------------------------------------
