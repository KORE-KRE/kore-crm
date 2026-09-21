-- KORE CRM — schema_v20.sql
-- Ports the safe, additive pieces of Kyle's residential rebuild onto the
-- live schema: richer transaction fields on offers/deals, and a proper
-- multiple-suspensive-conditions checklist per deal.
--
-- deal_conditions is a SUPPLEMENT to the existing deals.condition_status
-- field, not a replacement — condition_status still drives every
-- confirmed/suspensive financial total (leaderboard, dashboard, targets).
-- deal_conditions is a more granular "what's still outstanding" checklist
-- underneath that overall status, the same relationship deal_transfer_steps
-- already has to a deal's registered/not-registered state.

alter table offers
  add column if not exists deposit numeric default 0,
  add column if not exists occupation_date date,
  add column if not exists occupational_rental numeric default 0,
  add column if not exists finance_required boolean default false,
  add column if not exists cash_portion numeric default 0,
  add column if not exists bond_originator text,
  add column if not exists conveyancer text,
  add column if not exists buyer_phone text,
  add column if not exists seller_phone text;

alter table deals
  add column if not exists deposit numeric default 0,
  add column if not exists occupation_date date,
  add column if not exists occupational_rental numeric default 0,
  add column if not exists finance_required boolean default false,
  add column if not exists cash_portion numeric default 0,
  add column if not exists buyer_phone text,
  add column if not exists seller_phone text,
  add column if not exists above_line_at timestamptz,
  add column if not exists above_line_by text references agents (id) on delete set null,
  add column if not exists above_line_notes text,
  add column if not exists conditions_fulfilled_at timestamptz;

create table if not exists deal_conditions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  condition_type text not null default 'Other',
  description text,
  responsible_party text,
  due_date date,
  status text not null default 'Outstanding',
  mandatory boolean not null default true,
  date_fulfilled date,
  notes text,
  created_by text references agents (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function touch_deal_condition_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_deal_condition_updated_at on deal_conditions;
create trigger trg_touch_deal_condition_updated_at
  before update on deal_conditions
  for each row execute function touch_deal_condition_updated_at();

create index if not exists idx_deal_conditions_deal_id on deal_conditions (deal_id, status);

create table if not exists offer_negotiations (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers (id) on delete cascade,
  party text not null default 'Buyer',
  action text not null default 'Counter',
  amount numeric,
  deposit numeric,
  occupation_date date,
  occupational_rental numeric,
  finance_required boolean,
  cash_portion numeric,
  notes text,
  created_by text references agents (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_offer_negotiations_offer_id on offer_negotiations (offer_id, created_at);

alter table deal_conditions enable row level security;
alter table offer_negotiations enable row level security;

drop policy if exists "deal_conditions_admin_all" on deal_conditions;
create policy "deal_conditions_admin_all" on deal_conditions for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

drop policy if exists "deal_conditions_agent_own" on deal_conditions;
create policy "deal_conditions_agent_own" on deal_conditions for all
  using (
    current_role_name() = 'agent'
    and exists (
      select 1 from deals d
      where d.id = deal_conditions.deal_id
        and (d.agent_id = current_agent_id()
          or d.listing_agent_id = current_agent_id()
          or d.shared_with_agent_id = current_agent_id())
    )
  )
  with check (
    current_role_name() = 'agent'
    and exists (
      select 1 from deals d
      where d.id = deal_conditions.deal_id
        and (d.agent_id = current_agent_id()
          or d.listing_agent_id = current_agent_id()
          or d.shared_with_agent_id = current_agent_id())
    )
  );

drop policy if exists "deal_conditions_officeadmin_select" on deal_conditions;
create policy "deal_conditions_officeadmin_select" on deal_conditions for select
  using (current_role_name() = 'officeAdmin');

drop policy if exists "offer_negotiations_admin_all" on offer_negotiations;
create policy "offer_negotiations_admin_all" on offer_negotiations for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

drop policy if exists "offer_negotiations_agent_own" on offer_negotiations;
create policy "offer_negotiations_agent_own" on offer_negotiations for all
  using (
    current_role_name() = 'agent'
    and exists (
      select 1 from offers o
      where o.id = offer_negotiations.offer_id
        and (o.agent_id = current_agent_id()
          or o.listing_agent_id = current_agent_id()
          or o.shared_with_agent_id = current_agent_id())
    )
  )
  with check (
    current_role_name() = 'agent'
    and exists (
      select 1 from offers o
      where o.id = offer_negotiations.offer_id
        and (o.agent_id = current_agent_id()
          or o.listing_agent_id = current_agent_id()
          or o.shared_with_agent_id = current_agent_id())
    )
  );
