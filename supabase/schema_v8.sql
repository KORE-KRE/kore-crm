-- KORE CRM — schema_v8.sql
-- The real, complete fix. current_role_name()/current_agent_id() are used
-- by EVERY RLS policy in the schema (that's why the errors spread across
-- unrelated tables — deals, agents, marketing_budgets, canvassing_records
-- — not just leads). Neither function was marked `security definer`, so
-- each call queried user_profiles subject to ITS OWN RLS policy, which
-- itself calls current_role_name() again — a self-reference on the most
-- heavily used function in the whole system. This is the standard,
-- documented Supabase pattern for exactly this situation: mark the helper
-- functions security definer with an explicit search_path so their
-- internal lookup bypasses RLS instead of re-triggering it.

create or replace function current_role_name() returns text
  language sql stable security definer set search_path = public as $$
  select role from user_profiles where id = auth.uid()
$$;

create or replace function current_agent_id() returns text
  language sql stable security definer set search_path = public as $$
  select agent_id from user_profiles where id = auth.uid()
$$;
