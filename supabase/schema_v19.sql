-- KORE CRM — schema_v19.sql
-- Todos never had a real due-date column — a few flows (offer follow-ups,
-- meeting feedback) already set `dueDate` on the in-memory todo object,
-- but it was silently dropped before reaching Supabase, so it never
-- survived a page refresh. Add the column so due dates actually persist,
-- and so the new manual "+ Add task" flow can set one too.

alter table todos add column if not exists due_date date;
