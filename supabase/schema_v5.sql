-- KORE CRM — schema_v5.sql
-- Schedules the daily to-do digest email. The daily-digest Edge Function
-- is already deployed and its CRON_SECRET already set (both done via the
-- Supabase CLI during setup) — the project ref and secret below are the
-- real values already in use, not placeholders.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('kore-daily-digest')
where exists (select 1 from cron.job where jobname = 'kore-daily-digest');

select cron.schedule(
  'kore-daily-digest',
  '0 5 * * *', -- 05:00 UTC = 07:00 SAST (Africa/Johannesburg is UTC+2 year-round, no DST)
  $$
  select net.http_post(
    url := 'https://imvnevtgiabwjautxric.supabase.co/functions/v1/daily-digest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'add4cda40a33f7c261cebb5c741a0bbb5104b39d8e9a2386'),
    body := '{}'::jsonb
  );
  $$
);

-- To confirm it's scheduled:
-- select * from cron.job where jobname = 'kore-daily-digest';

-- To see run history / catch failures:
-- select * from cron.job_run_details order by start_time desc limit 10;
