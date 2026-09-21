-- KORE CRM — schema_v23.sql
-- Rentals targets: a per-agent, per-year target on number of MANAGED
-- deals completed (a headcount, not a Rand amount) — mirrors agent_targets
-- but counts deals instead of summing commission.

create table if not exists rental_agent_targets (
  agent_id text not null references rental_agents(id) on delete cascade,
  year text not null,
  managed_deals_target integer not null default 0,
  primary key (agent_id, year)
);

alter table rental_agent_targets enable row level security;

drop policy if exists "rental_agent_targets_admin_all" on rental_agent_targets;
create policy "rental_agent_targets_admin_all" on rental_agent_targets for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
