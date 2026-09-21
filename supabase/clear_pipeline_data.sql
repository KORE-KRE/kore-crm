-- KORE CRM — clear_pipeline_data.sql
-- One-time cleanup: wipes the fictional/test pipeline data built up while
-- testing KORE, so the system starts clean for real use.
--
-- Cleared: leads (+ activity/collaborators/merge requests/allocations),
-- offers (+ activity/negotiation history), deals (+ activity/transfer
-- steps/suspensive conditions), canvassing records (+ notes/valuations),
-- contacts, and todos.
--
-- NOT touched: agents, user accounts/logins, attorney directory, role
-- permissions, column settings, Microsoft To Do connections, marketing
-- budgets/campaigns.
--
-- This is IRREVERSIBLE. There is no undo once this runs.

truncate table
  leads,
  offers,
  deals,
  canvassing_records,
  contacts,
  todos,
  lead_merge_requests,
  lead_allocations
restart identity cascade;
