-- KORE CRM — schema_v16.sql
-- Root cause of "leaderboard not updating": the Deals page's Month field
-- was a free-text input, so it could be left blank or typed without a
-- year (e.g. "May" instead of "May 2026"). Every period filter in the app
-- (leaderboard, dashboard, targets) requires a real "Mon YYYY" value —
-- anything else silently drops the deal from every total. The app now
-- renders Month as a dropdown (same fix already applied to Offers), but
-- this backfills the deals that were typed in before that change, using
-- each deal's real created_at timestamp.

update deals
set month = to_char(created_at, 'Mon YYYY')
where month is null or month !~ '^[A-Za-z]{3} [0-9]{4}$';

-- To see which rows this affected (run before or after, both fine):
-- select id, property, month, created_at from deals where month is null or month !~ '^[A-Za-z]{3} [0-9]{4}$';
