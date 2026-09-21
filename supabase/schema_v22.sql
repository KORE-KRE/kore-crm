-- KORE CRM — schema_v22.sql
-- Rentals vertical: a parallel pipeline to Sales, with its own agent
-- roster, offers, and deals. Separate tables (not a type flag on the
-- existing sales tables) — Rentals uses a flat Finder's Fee instead of
-- Sales' tiered commission waterfall, and rental brokers must never show
-- up in the Sales leaderboard or vice versa.
--
-- No rental-agent logins exist yet (roster only, for now), so RLS here is
-- deliberately simple: masterAdmin/officeManager only. Revisit once
-- rental agents get real KORE accounts.

create table if not exists rental_agents (
  id text primary key,
  name text not null,
  initials text not null,
  title text,
  cell text,
  email text,
  photo_path text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists rental_offers (
  id uuid primary key default gen_random_uuid(),
  month text,
  property text,
  suburb text,
  landlord_name text,
  landlord_phone text,
  landlord_contact_id uuid references contacts(id) on delete set null,
  tenant_name text,
  tenant_phone text,
  tenant_contact_id uuid references contacts(id) on delete set null,
  monthly_rental numeric not null default 0,
  finders_fee numeric not null default 0,
  term_of_lease_months integer,
  managed boolean not null default true,
  conditions text,
  agent_id text references rental_agents(id) on delete set null,
  listing_agent_id text references rental_agents(id) on delete set null,
  shared_with_agent_id text references rental_agents(id) on delete set null,
  shared_split text,
  status text not null default 'Pending',
  deal_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists rental_offer_activity (
  id uuid primary key default gen_random_uuid(),
  rental_offer_id uuid not null references rental_offers(id) on delete cascade,
  type text,
  text text,
  created_at timestamptz not null default now()
);

create table if not exists rental_deals (
  id uuid primary key default gen_random_uuid(),
  rental_offer_id uuid references rental_offers(id) on delete set null,
  month text,
  property text,
  suburb text,
  landlord_name text,
  landlord_phone text,
  landlord_contact_id uuid references contacts(id) on delete set null,
  tenant_name text,
  tenant_phone text,
  tenant_contact_id uuid references contacts(id) on delete set null,
  monthly_rental numeric not null default 0,
  finders_fee numeric not null default 0,
  term_of_lease_months integer,
  managed boolean not null default true,
  admin_fee_paid boolean not null default false,
  monthly_management_fee numeric not null default 0,
  monthly_inspections boolean not null default false,
  signed_lease boolean not null default false,
  move_in_date date,
  agent_id text references rental_agents(id) on delete set null,
  listing_agent_id text references rental_agents(id) on delete set null,
  shared_with_agent_id text references rental_agents(id) on delete set null,
  shared_split text,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists rental_deal_activity (
  id uuid primary key default gen_random_uuid(),
  rental_deal_id uuid not null references rental_deals(id) on delete cascade,
  text text,
  created_at timestamptz not null default now()
);

alter table rental_offers add constraint rental_offers_deal_id_fkey
  foreign key (deal_id) references rental_deals(id) on delete set null;

create index if not exists idx_rental_offer_activity_offer_id on rental_offer_activity (rental_offer_id, created_at);
create index if not exists idx_rental_deal_activity_deal_id on rental_deal_activity (rental_deal_id, created_at);
create index if not exists idx_rental_offers_agent_id on rental_offers (agent_id);
create index if not exists idx_rental_deals_agent_id on rental_deals (agent_id);
create index if not exists idx_rental_deals_status on rental_deals (status);

alter table rental_agents enable row level security;
alter table rental_offers enable row level security;
alter table rental_offer_activity enable row level security;
alter table rental_deals enable row level security;
alter table rental_deal_activity enable row level security;

drop policy if exists "rental_agents_admin_all" on rental_agents;
create policy "rental_agents_admin_all" on rental_agents for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

drop policy if exists "rental_offers_admin_all" on rental_offers;
create policy "rental_offers_admin_all" on rental_offers for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

drop policy if exists "rental_offer_activity_admin_all" on rental_offer_activity;
create policy "rental_offer_activity_admin_all" on rental_offer_activity for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

drop policy if exists "rental_deals_admin_all" on rental_deals;
create policy "rental_deals_admin_all" on rental_deals for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

drop policy if exists "rental_deal_activity_admin_all" on rental_deal_activity;
create policy "rental_deal_activity_admin_all" on rental_deal_activity for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

insert into rental_agents (id, name, initials, active) values
  ('kevin', 'Kevin', 'KE', true),
  ('luke', 'Luke', 'LU', true),
  ('amy', 'Amy', 'AM', true),
  ('angela', 'Angela', 'AN', true)
on conflict (id) do nothing;
