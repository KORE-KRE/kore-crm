-- KORE CRM — schema_v14.sql
-- Backfills the `month` field on any deal left with a blank one from the
-- offer-conversion bug fixed earlier — those deals are invisible to every
-- period filter in the app (leaderboard, dashboard, targets) until this
-- runs. Uses each deal's actual `created_at` timestamp, so every deal
-- gets the real month it was created in rather than defaulting them all
-- to today.

update deals
set month = to_char(created_at, 'Mon YYYY')
where month is null or month = '';

-- To see which rows this affected (run before or after, both fine):
-- select id, property, month, created_at from deals where month is null or month = '';
