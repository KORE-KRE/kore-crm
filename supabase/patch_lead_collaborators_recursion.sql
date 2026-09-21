-- Patch: fixes "infinite recursion detected in policy for relation
-- lead_collaborators" — leads' RLS policy queried lead_collaborators, and
-- lead_collaborators' RLS policy queried leads right back, a genuine
-- circular dependency. Run this once in the SQL editor.

create or replace function is_lead_collaborator(p_lead_id uuid, p_agent_id text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from lead_collaborators where lead_id = p_lead_id and agent_id = p_agent_id)
$$;

create or replace function lead_owner_agent_id(p_lead_id uuid) returns text
  language sql stable security definer set search_path = public as $$
  select agent_id from leads where id = p_lead_id
$$;

drop policy if exists "leads_agent_own" on leads;
create policy "leads_agent_own" on leads for all
  using (current_role_name() = 'agent' and (agent_id = current_agent_id()
    or is_lead_collaborator(leads.id, current_agent_id())))
  with check (current_role_name() = 'agent' and agent_id = current_agent_id());

drop policy if exists "lead_activity_agent_own" on lead_activity;
create policy "lead_activity_agent_own" on lead_activity for all
  using (current_role_name() = 'agent' and (lead_owner_agent_id(lead_activity.lead_id) = current_agent_id()
    or is_lead_collaborator(lead_activity.lead_id, current_agent_id())))
  with check (current_role_name() = 'agent' and (lead_owner_agent_id(lead_activity.lead_id) = current_agent_id()
    or is_lead_collaborator(lead_activity.lead_id, current_agent_id())));

drop policy if exists "lead_collaborators_agent_read" on lead_collaborators;
create policy "lead_collaborators_agent_read" on lead_collaborators for select
  using (current_role_name() = 'agent' and (agent_id = current_agent_id()
    or lead_owner_agent_id(lead_collaborators.lead_id) = current_agent_id()));
