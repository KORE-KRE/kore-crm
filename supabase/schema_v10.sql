-- KORE CRM — schema_v10.sql
-- Adds active/inactive status to agents. Inactive means: all their data
-- stays exactly as-is (leads, deals, offers, canvassing, targets — none
-- of it moves or changes), but their login is revoked entirely (handled
-- by the set-agent-status Edge Function, which bans the linked auth
-- account server-side — this column alone doesn't block login by
-- itself). masterAdmin/officeManager keep full access to an inactive
-- agent's data regardless, same as any other agent's data today.

alter table agents add column if not exists active boolean not null default true;

-- Extend the existing masterAdmin-only column guard (previously only
-- covered `tier`) to also cover `active`, so this is enforced at the
-- database level, not just by hiding the control in the UI.
create or replace function enforce_masteradmin_agent_tier() returns trigger
language plpgsql as $$
begin
  if current_role_name() <> 'masterAdmin' then
    if NEW.tier is distinct from OLD.tier then
      raise exception 'Only Master Admin can change an agent''s status (tier)';
    end if;
    if NEW.active is distinct from OLD.active then
      raise exception 'Only Master Admin can activate/deactivate an agent';
    end if;
  end if;
  return NEW;
end;
$$;
