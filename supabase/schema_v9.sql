-- KORE CRM — schema_v9.sql
-- Fixes "delete agent" failing outright: every foreign key pointing at
-- agents(id) was created with no ON DELETE behavior, which defaults to
-- RESTRICT — Postgres refuses to delete an agent row while ANY lead,
-- offer, deal, todo, etc. still references it. That's most agents, most
-- of the time.
--
-- This migration doesn't touch the underlying leads/offers/deals rows
-- themselves — those are preserved. It only changes what happens to the
-- *agent_id column* on those rows when the agent is deleted:
--   - Most tables: the agent_id column is set to NULL (the record stays,
--     but shows as unassigned — no longer attributable to that agent on
--     the leaderboard or anywhere else).
--   - Three tables (agent_targets, campaign_brokers, lead_collaborators)
--     have agent_id as PART of their primary key, so it can't be set to
--     NULL — those specific junction/target rows are deleted along with
--     the agent instead (there's nothing meaningful left for a "target
--     for no one" or "campaign assignment to no one" row to represent).
--
-- Uses a small throwaway helper function to find each FK's real
-- constraint name (rather than guessing it), so this works regardless of
-- exact auto-generated naming, then drops and recreates it with the
-- right ON DELETE behavior. The helper function is dropped again at the
-- end — it's a one-time migration tool, not part of the app.

create or replace function _fix_agent_fk(p_table text, p_column text, p_action text) returns void
language plpgsql as $$
declare
  conname text;
begin
  select con.conname into conname
  from pg_constraint con
  join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
  where con.contype = 'f'
    and con.conrelid = p_table::regclass
    and att.attname = p_column
    and con.confrelid = 'agents'::regclass
    and array_length(con.conkey, 1) = 1
  limit 1;

  if conname is not null then
    execute format('alter table %I drop constraint %I', p_table, conname);
  end if;

  execute format('alter table %I add constraint %I foreign key (%I) references agents (id) on delete %s',
    p_table, p_table || '_' || p_column || '_fkey', p_column, p_action);
end;
$$;

select _fix_agent_fk('user_profiles', 'agent_id', 'set null');
select _fix_agent_fk('leads', 'agent_id', 'set null');
select _fix_agent_fk('lead_activity', 'author_id', 'set null');
select _fix_agent_fk('offers', 'agent_id', 'set null');
select _fix_agent_fk('offers', 'listing_agent_id', 'set null');
select _fix_agent_fk('offers', 'shared_with_agent_id', 'set null');
select _fix_agent_fk('deals', 'agent_id', 'set null');
select _fix_agent_fk('deals', 'listing_agent_id', 'set null');
select _fix_agent_fk('deals', 'shared_with_agent_id', 'set null');
select _fix_agent_fk('agent_targets', 'agent_id', 'cascade');
select _fix_agent_fk('canvassing_records', 'broker_id', 'set null');
select _fix_agent_fk('canvassing_notes', 'author_id', 'set null');
select _fix_agent_fk('campaign_brokers', 'agent_id', 'cascade');
select _fix_agent_fk('lead_collaborators', 'agent_id', 'cascade');
select _fix_agent_fk('lead_merge_requests', 'requesting_agent_id', 'set null');
select _fix_agent_fk('lead_merge_requests', 'matched_agent_id', 'set null');
select _fix_agent_fk('lead_allocations', 'agent_id', 'set null');
select _fix_agent_fk('todos', 'agent_id', 'set null');
select _fix_agent_fk('listings', 'agent_id', 'set null');
select _fix_agent_fk('canvassing_valuations', 'agent_id', 'set null');
select _fix_agent_fk('offer_activity', 'author_id', 'set null');

drop function _fix_agent_fk(text, text, text);
