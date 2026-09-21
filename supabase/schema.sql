-- KORE CRM — Starter Supabase schema
-- This is a first-pass translation of the prototype's data model into real
-- Postgres tables. Paste this into Supabase's SQL Editor (or hand it to
-- Claude Code) as the starting point — it will very likely need refinement
-- once the real app is wired up against it (missing fields, additional
-- indexes, etc.), but it captures the core shape of every feature already
-- built: agents, roles, leads, offers, deals, targets, canvassing, the
-- attorney directory, and marketing campaigns.

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Agents (the sales team roster)
-- ---------------------------------------------------------------------
create table agents (
  id text primary key,              -- e.g. 'a1', 'a2' — keep matching the prototype's ids for an easy migration
  name text not null,
  initials text,
  office text,
  cell text,
  email text
);

-- ---------------------------------------------------------------------
-- User profiles — links a real Supabase Auth login to a role and,
-- for Agents, to a specific row in `agents`.
-- ---------------------------------------------------------------------
create table user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('masterAdmin', 'officeManager', 'agent', 'marketing', 'officeAdmin')),
  agent_id text references agents (id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------
create table leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  source text,
  listing_ref text,
  listing_address text,
  price numeric,
  message text,
  status text default 'New', -- New, Contacted, Viewing Booked, Offer Made, Sold, Lost
  agent_id text references agents (id),
  campaign_id uuid,
  created_at timestamptz default now()
);

create table lead_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  type text,          -- System, Note, Call, Email, WhatsApp, Viewing Booked, Viewing Feedback
  text text,
  author_id text references agents (id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Offers (the negotiation stage, before a deal exists)
-- ---------------------------------------------------------------------
create table offers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id),
  deal_id uuid, -- set once converted
  property text,
  suburb text,
  asking_price numeric,
  offer_made numeric,
  conditions text,
  seller_counter_offer numeric default 0,
  buyer_counter_offer numeric default 0,
  agreed text default 'Pending', -- Pending, Yes, No
  agreed_price numeric default 0,
  agent_id text references agents (id),
  listing_agent_id text references agents (id),
  buyer_name text,
  seller_name text,
  shared_with_agent_id text references agents (id),
  shared_split text,
  com_percent numeric default 5,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Deals
-- ---------------------------------------------------------------------
create table deals (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references offers (id),
  lead_id uuid references leads (id),
  property text,
  suburb text,
  asking_price numeric,
  agreed_offer numeric,
  com_percent numeric,
  confirmed_commission numeric,
  condition_status text, -- Above the line / Suspensive Bond / etc — drives Confirmed vs Suspensive
  deal_tier text,        -- Yellow / Blue / Silver / Gold — drives the commission split
  agent_id text references agents (id),
  listing_agent_id text references agents (id),
  shared_with_agent_id text references agents (id),
  shared_split text,
  bond_through text,
  bond_applying_for numeric,
  attorney text,
  exp_reg_date date,
  registered boolean default false,
  registered_date date,
  otp_sent_buyer boolean default false,
  otp_sent_seller boolean default false,
  otp_sent_attorney boolean default false,
  created_at timestamptz default now()
);

create table deal_activity (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals (id) on delete cascade,
  text text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Targets
-- ---------------------------------------------------------------------
create table agent_targets (
  agent_id text references agents (id),
  year int,
  amount numeric,
  primary key (agent_id, year)
);

-- ---------------------------------------------------------------------
-- Canvassing / Area Canvas
-- ---------------------------------------------------------------------
create table canvassing_records (
  id uuid primary key default gen_random_uuid(),
  address text,
  suburb text,
  owner_name text,
  owner_phone text,
  email text,
  sell_price numeric,
  marketing_link text,
  status text default 'Uncontacted', -- Uncontacted, Number Requested, Contacted, Listed Buildings
  broker_id text references agents (id),
  no_info_obtained boolean default false,
  archived boolean default false,
  follow_up_date date,
  created_at timestamptz default now()
);

create table canvassing_notes (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references canvassing_records (id) on delete cascade,
  text text,
  type text, -- Note, Call, Door Knock, Listing, System
  author_id text references agents (id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Attorney directory
-- ---------------------------------------------------------------------
create table attorneys (
  name text primary key,
  contact_name text,
  email text,
  phone text
);

-- ---------------------------------------------------------------------
-- Marketing
-- ---------------------------------------------------------------------
create table marketing_budgets (
  id uuid primary key default gen_random_uuid(),
  name text,
  platform text,
  sector text,
  start_date date,
  end_date date,
  budget numeric,
  archived boolean default false
);

create table marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text,
  budget_id uuid references marketing_budgets (id),
  platform text,
  sector text,
  area text,
  status text, -- Planned, Live, Paused, Ended
  spend numeric default 0,
  allocation numeric default 0,
  start_date date,
  end_date date,
  archived boolean default false
);

create table campaign_brokers (
  campaign_id uuid references marketing_campaigns (id) on delete cascade,
  agent_id text references agents (id),
  primary key (campaign_id, agent_id)
);

-- ---------------------------------------------------------------------
-- Row Level Security — enable it, then add real policies once the
-- login system is built. Leaving RLS OFF is not safe for production;
-- this just turns it on so nothing is queryable until policies exist.
-- ---------------------------------------------------------------------
alter table agents enable row level security;
alter table user_profiles enable row level security;
alter table leads enable row level security;
alter table lead_activity enable row level security;
alter table offers enable row level security;
alter table deals enable row level security;
alter table deal_activity enable row level security;
alter table agent_targets enable row level security;
alter table canvassing_records enable row level security;
alter table canvassing_notes enable row level security;
alter table attorneys enable row level security;
alter table marketing_budgets enable row level security;
alter table marketing_campaigns enable row level security;
alter table campaign_brokers enable row level security;

-- Example policy shape (not exhaustive — this is the pattern to repeat):
-- Master Admin and Office Manager can read everything; an Agent can only
-- read their own leads/offers/deals. This one policy needs a matching
-- version on every table above before the app can safely go live.
--
-- create policy "Agents see their own leads"
--   on leads for select
--   using (
--     agent_id = (select agent_id from user_profiles where id = auth.uid())
--     or (select role from user_profiles where id = auth.uid()) in ('masterAdmin', 'officeManager')
--   );
