-- ============================================================
-- Schedule the weekly Zoom → webinar_events sync.
-- Runs every Wednesday 00:00 UTC (≈ Wed midday NZ) — just after the
-- Wednesday-morning session — so the finished date rolls off and the
-- page always shows the next two upcoming occurrences.
--
-- Run once in the Supabase SQL editor. Idempotent (safe to re-run).
-- Replace <PUBLISHABLE_KEY> with VITE_SUPABASE_PUBLISHABLE_KEY.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- remove any prior schedules for this sync
select cron.unschedule(jobid)
from cron.job
where jobname in ('zoom-sync-hourly', 'zoom-sync-weekly', 'zoom-sync-postmeeting');

-- (re)create the post-meeting weekly job
select cron.schedule(
  'zoom-sync-postmeeting',
  '0 0 * * 3',                       -- Wednesdays 00:00 UTC
  $$
  select net.http_post(
    url     := 'https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/zoom-sync',
    headers := '{"Content-Type":"application/json","apikey":"<PUBLISHABLE_KEY>"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- verify
select jobname, schedule, active from cron.job where jobname = 'zoom-sync-postmeeting';
