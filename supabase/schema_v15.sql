-- KORE CRM — schema_v15.sql
-- Offers never had a month field (deliberately dropped early on since
-- the original schema draft didn't have one) — but the user now wants
-- agents to pick a month on the offer itself, and for that choice to
-- carry through when it becomes a deal, rather than defaulting to
-- "today" at conversion time. Add it back properly.

alter table offers add column if not exists month text;
