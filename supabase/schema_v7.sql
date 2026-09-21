-- KORE CRM — schema_v7.sql
-- Fixes real infinite recursion between `leads` and `lead_collaborators`
-- RLS policies (seen in Postgres logs as "54001 stack depth limit
-- exceeded"). The earlier patch (security definer functions) assumed
-- those functions bypass RLS internally — they don't, in this project —
-- so the cycle was still there, just one layer removed. This version
-- removes the cross-table reference entirely instead of relying on that.
--
-- Trade-off: an agent added as a collaborator (not the primary agent) on
-- someone else's lead will no longer see that lead through RLS — only
-- leads where they are the primary agent_id. This can be restored properly
-- later via a verified RPC if you want full collaborator visibility back;
-- for now this unblocks the whole app, which was affected, not just Leads.

drop policy if exists "leads_agent_own" on leads;
create policy "leads_agent_own" on leads for all
  using (current_role_name() = 'agent' and agent_id = current_agent_id())
  with check (current_role_name() = 'agent' and agent_id = current_agent_id());

drop policy if exists "lead_activity_agent_own" on lead_activity;
create policy "lead_activity_agent_own" on lead_activity for all
  using (current_role_name() = 'agent' and lead_owner_agent_id(lead_activity.lead_id) = current_agent_id())
  with check (current_role_name() = 'agent' and lead_owner_agent_id(lead_activity.lead_id) = current_agent_id());

drop policy if exists "lead_collaborators_agent_read" on lead_collaborators;
create policy "lead_collaborators_agent_read" on lead_collaborators for select
  using (current_role_name() = 'agent' and agent_id = current_agent_id());
