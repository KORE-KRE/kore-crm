-- KORE CRM — schema_v2.sql
-- Additive migration on top of schema.sql. Run this in the Supabase SQL
-- editor AFTER schema.sql. Adds every table/column the real app needs,
-- the auth-provisioning RPCs, and (at the bottom) the real RLS policies.
--
-- NOTE ON SEQUENCING: this file also creates the two storage buckets and
-- their policies. If you re-run this file, table/column DDL uses
-- `if not exists` / guarded blocks where possible so it's safe to re-run,
-- but policies are dropped and recreated (Postgres has no
-- `create policy if not exists`).

-- ---------------------------------------------------------------------
-- 1. New columns on existing tables
-- ---------------------------------------------------------------------

alter table leads
  add column if not exists requirements jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_campaign_id_fkey'
  ) then
    alter table leads
      add constraint leads_campaign_id_fkey
      foreign key (campaign_id) references marketing_campaigns (id)
      on delete set null;
  end if;
end $$;

alter table marketing_campaigns
  add column if not exists notes text;

alter table canvassing_records
  add column if not exists erf_ref text,
  add column if not exists erf_size_sqm int,
  add column if not exists trx_date date,
  add column if not exists known_name text,
  add column if not exists id_number text,
  add column if not exists age text;

alter table offers
  add column if not exists shared_deal text;

alter table deals
  add column if not exists month text,
  add column if not exists conditions text,
  add column if not exists opening_offer numeric,
  add column if not exists suspensive numeric default 0,
  add column if not exists fall_out numeric default 0,
  add column if not exists kre_nett_confirmed numeric default 0,
  add column if not exists kre_nett_sus numeric default 0,
  add column if not exists nett_to_kre numeric default 0,
  add column if not exists still_to_register text,
  add column if not exists co_seller numeric,
  add column if not exists co_buyers numeric,
  add column if not exists cco text,
  add column if not exists shared_deal text,
  add column if not exists buyer_email text,
  add column if not exists seller_email text,
  add column if not exists otp_file_path text,
  add column if not exists comm_statement_file_path text;

-- ---------------------------------------------------------------------
-- 2. New tables
-- ---------------------------------------------------------------------

create table if not exists lead_collaborators (
  lead_id uuid references leads (id) on delete cascade,
  agent_id text references agents (id),
  primary key (lead_id, agent_id)
);

create table if not exists lead_merge_requests (
  id uuid primary key default gen_random_uuid(),
  incoming_name text,
  incoming_phone text,
  incoming_email text,
  incoming_message text,
  incoming_source text,
  existing_lead_id uuid references leads (id) on delete cascade,
  requesting_agent_id text references agents (id),
  matched_agent_id text references agents (id),
  status text default 'pending', -- pending, approved, rejected
  match_reason text,             -- 'phone' or 'email'
  created_at timestamptz default now()
);

create table if not exists lead_allocations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  agent_id text references agents (id),
  campaign_id uuid references marketing_campaigns (id),
  created_at timestamptz default now()
);

create table if not exists marketing_broker_rotation (
  id int primary key default 1 check (id = 1),
  agent_ids text[] not null default '{}',
  cursor int not null default 0
);
insert into marketing_broker_rotation (id, agent_ids, cursor)
  values (1, '{}', 0)
  on conflict (id) do nothing;

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  category text,          -- Tenant, Buyer, Landlord/Property Owner, etc
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  agent_id text references agents (id),
  kind text,               -- followup, merge-review, canvas-number-request, otp-send, etc
  label text not null,
  done boolean default false,
  lead_id uuid references leads (id) on delete cascade,
  deal_id uuid references deals (id) on delete cascade,
  offer_id uuid references offers (id) on delete cascade,
  canvassing_record_id uuid references canvassing_records (id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists listings (
  id text primary key,
  ref text unique,
  address text,
  suburb text,
  price numeric,
  type text,
  beds int,
  baths int,
  parking int,
  status text,             -- Active, Under Offer, Sold
  agent_id text references agents (id),
  portals text[] default '{}'
);

create table if not exists canvassing_valuations (
  id uuid primary key default gen_random_uuid(),
  canvassing_record_id uuid references canvassing_records (id) on delete cascade,
  date date,
  agent_id text references agents (id),
  price numeric,
  pdf_path text,
  created_at timestamptz default now()
);

-- 17 fixed steps (see TRANSFER_STEPS in src/App.jsx) — labels stay client-side
create table if not exists deal_transfer_steps (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals (id) on delete cascade,
  step_index int not null check (step_index between 0 and 16),
  done boolean default false,
  date_completed date,
  unique (deal_id, step_index)
);

alter table deals add column if not exists otp_todo_id uuid references todos (id);

create table if not exists offer_activity (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references offers (id) on delete cascade,
  type text,
  text text,
  author_id text references agents (id),
  created_at timestamptz default now()
);

create table if not exists role_permissions (
  role text not null,
  nav_key text not null,
  allowed boolean not null default true,
  primary key (role, nav_key)
);

-- Seed from DEFAULT_ROLE_PERMISSIONS (src/App.jsx) — masterAdmin is always
-- full-access and intentionally has no rows here.
insert into role_permissions (role, nav_key, allowed) values
  ('officeManager','dashboard',true), ('officeManager','leads',true), ('officeManager','pipeline',true),
  ('officeManager','canvassing',true), ('officeManager','teampipeline',true), ('officeManager','offers',true),
  ('officeManager','deals',true), ('officeManager','leaderboard',true), ('officeManager','listings',true),
  ('officeManager','contacts',true), ('officeManager','agents',true), ('officeManager','todos',true),
  ('agent','dashboard',true), ('agent','leads',true), ('agent','pipeline',true),
  ('agent','canvassing',true), ('agent','teampipeline',false), ('agent','offers',true),
  ('agent','deals',true), ('agent','leaderboard',true), ('agent','listings',true),
  ('agent','contacts',false), ('agent','agents',false), ('agent','todos',true),
  ('officeAdmin','dashboard',true), ('officeAdmin','leads',false), ('officeAdmin','pipeline',false),
  ('officeAdmin','canvassing',true), ('officeAdmin','teampipeline',false), ('officeAdmin','offers',false),
  ('officeAdmin','deals',true), ('officeAdmin','leaderboard',false), ('officeAdmin','listings',false),
  ('officeAdmin','contacts',true), ('officeAdmin','agents',false), ('officeAdmin','todos',true)
on conflict (role, nav_key) do nothing;

create table if not exists role_deal_columns (
  role text not null,
  column_key text not null,
  primary key (role, column_key)
);

-- ---------------------------------------------------------------------
-- 3. Helper functions for RLS
-- ---------------------------------------------------------------------

create or replace function current_role_name() returns text
  language sql stable as $$
  select role from user_profiles where id = auth.uid()
$$;

create or replace function current_agent_id() returns text
  language sql stable as $$
  select agent_id from user_profiles where id = auth.uid()
$$;

-- security definer + internal-RLS-bypass helpers, specifically to break the
-- leads <-> lead_collaborators circular RLS dependency (leads' policy needs
-- to check lead_collaborators, and lead_collaborators' policy needs to check
-- leads — evaluated as plain subqueries, each side re-triggers the other
-- table's RLS policy, which Postgres correctly refuses as infinite
-- recursion). These functions run with the privileges of their owner, so
-- their internal queries bypass RLS entirely instead of re-entering it.
create or replace function is_lead_collaborator(p_lead_id uuid, p_agent_id text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from lead_collaborators where lead_id = p_lead_id and agent_id = p_agent_id)
$$;

create or replace function lead_owner_agent_id(p_lead_id uuid) returns text
  language sql stable security definer set search_path = public as $$
  select agent_id from leads where id = p_lead_id
$$;

-- ---------------------------------------------------------------------
-- 4. Auth provisioning RPCs (masterAdmin-only, security definer, no
--    service_role key required anywhere)
-- ---------------------------------------------------------------------

create or replace function list_pending_users()
returns table (id uuid, email text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if (select role from user_profiles where id = auth.uid()) <> 'masterAdmin' then
    raise exception 'not authorized';
  end if;
  return query
    select u.id, u.email, u.created_at
    from auth.users u
    left join user_profiles p on p.id = u.id
    where p.id is null
    order by u.created_at desc;
end; $$;
revoke all on function list_pending_users() from public;
grant execute on function list_pending_users() to authenticated;

create or replace function approve_user(target_id uuid, target_role text, target_agent_id text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select role from user_profiles where id = auth.uid()) <> 'masterAdmin' then
    raise exception 'not authorized';
  end if;
  insert into user_profiles (id, role, agent_id) values (target_id, target_role, target_agent_id);
end; $$;
revoke all on function approve_user(uuid, text, text) from public;
grant execute on function approve_user(uuid, text, text) to authenticated;

create or replace function update_user_role(target_id uuid, target_role text, target_agent_id text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select role from user_profiles where id = auth.uid()) <> 'masterAdmin' then
    raise exception 'not authorized';
  end if;
  update user_profiles set role = target_role, agent_id = target_agent_id where id = target_id;
end; $$;
revoke all on function update_user_role(uuid, text, text) from public;
grant execute on function update_user_role(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Enable RLS on every new table
-- ---------------------------------------------------------------------

alter table lead_collaborators enable row level security;
alter table lead_merge_requests enable row level security;
alter table lead_allocations enable row level security;
alter table marketing_broker_rotation enable row level security;
alter table contacts enable row level security;
alter table todos enable row level security;
alter table listings enable row level security;
alter table canvassing_valuations enable row level security;
alter table deal_transfer_steps enable row level security;
alter table offer_activity enable row level security;
alter table role_permissions enable row level security;
alter table role_deal_columns enable row level security;

-- ---------------------------------------------------------------------
-- 6. RLS policies — every table, every role
--
-- Roles: masterAdmin, officeManager, agent, officeAdmin, marketing
-- Pattern: masterAdmin/officeManager = full access. agent = own-scoped.
-- officeAdmin/marketing = only the domains DEFAULT_ROLE_PERMISSIONS grants
-- them (canvassing+deals+contacts+todos for officeAdmin; marketing-only
-- for marketing).
-- ---------------------------------------------------------------------

-- Drop-and-recreate helper so this file is safely re-runnable
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- agents: read-all (needed everywhere for name lookups), write = admin/OM
create policy "agents_select_all" on agents for select using (auth.uid() is not null);
create policy "agents_write_admin" on agents for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

-- user_profiles: read own row, masterAdmin reads all; writes only via RPCs above
create policy "profiles_select_own" on user_profiles for select
  using (id = auth.uid() or current_role_name() = 'masterAdmin');
create policy "profiles_insert_own" on user_profiles for insert
  with check (id = auth.uid());

-- leads (+ activity, collaborators, allocations, merge_requests)
create policy "leads_admin_all" on leads for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
create policy "leads_agent_own" on leads for all
  using (current_role_name() = 'agent' and (agent_id = current_agent_id()
    or is_lead_collaborator(leads.id, current_agent_id())))
  with check (current_role_name() = 'agent' and agent_id = current_agent_id());

create policy "lead_activity_admin_all" on lead_activity for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
create policy "lead_activity_agent_own" on lead_activity for all
  using (current_role_name() = 'agent' and (lead_owner_agent_id(lead_activity.lead_id) = current_agent_id()
    or is_lead_collaborator(lead_activity.lead_id, current_agent_id())))
  with check (current_role_name() = 'agent' and (lead_owner_agent_id(lead_activity.lead_id) = current_agent_id()
    or is_lead_collaborator(lead_activity.lead_id, current_agent_id())));

create policy "lead_collaborators_admin_all" on lead_collaborators for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
create policy "lead_collaborators_agent_read" on lead_collaborators for select
  using (current_role_name() = 'agent' and (agent_id = current_agent_id()
    or lead_owner_agent_id(lead_collaborators.lead_id) = current_agent_id()));

create policy "lead_allocations_admin_marketing" on lead_allocations for all
  using (current_role_name() in ('masterAdmin','officeManager','marketing'))
  with check (current_role_name() in ('masterAdmin','officeManager','marketing'));

create policy "lead_merge_requests_admin_all" on lead_merge_requests for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
create policy "lead_merge_requests_agent_insert" on lead_merge_requests for insert
  with check (current_role_name() = 'agent' and requesting_agent_id = current_agent_id());
create policy "lead_merge_requests_agent_read" on lead_merge_requests for select
  using (current_role_name() = 'agent' and requesting_agent_id = current_agent_id());

-- offers (+ activity)
create policy "offers_admin_all" on offers for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
create policy "offers_agent_own" on offers for all
  using (current_role_name() = 'agent' and (agent_id = current_agent_id()
    or listing_agent_id = current_agent_id() or shared_with_agent_id = current_agent_id()))
  with check (current_role_name() = 'agent' and (agent_id = current_agent_id()
    or listing_agent_id = current_agent_id() or shared_with_agent_id = current_agent_id()));

create policy "offer_activity_admin_all" on offer_activity for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
create policy "offer_activity_agent_own" on offer_activity for all
  using (current_role_name() = 'agent' and exists (
    select 1 from offers o where o.id = offer_activity.offer_id
      and (o.agent_id = current_agent_id() or o.listing_agent_id = current_agent_id() or o.shared_with_agent_id = current_agent_id())))
  with check (current_role_name() = 'agent' and exists (
    select 1 from offers o where o.id = offer_activity.offer_id
      and (o.agent_id = current_agent_id() or o.listing_agent_id = current_agent_id() or o.shared_with_agent_id = current_agent_id())));

-- deals (+ activity, transfer_steps)
create policy "deals_admin_all" on deals for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
create policy "deals_agent_own" on deals for all
  using (current_role_name() = 'agent' and (agent_id = current_agent_id()
    or listing_agent_id = current_agent_id() or shared_with_agent_id = current_agent_id()))
  with check (current_role_name() = 'agent' and (agent_id = current_agent_id()
    or listing_agent_id = current_agent_id() or shared_with_agent_id = current_agent_id()));
-- officeAdmin: full read, but writes limited to OTP/email columns.
-- NOTE: a plain column-level GRANT does not actually restrict this, because
-- Supabase's default project setup already grants full-table UPDATE on
-- public tables to the `authenticated` Postgres role (shared by every app
-- role — RLS is the only thing that differentiates masterAdmin/agent/
-- officeAdmin, since they're all the same DB role). Grants are additive, so
-- a narrower column grant on top of an existing full grant changes nothing.
-- The actual enforcement has to happen in a trigger that diffs OLD vs NEW.
create policy "deals_officeadmin_select" on deals for select
  using (current_role_name() = 'officeAdmin');
create policy "deals_officeadmin_update" on deals for update
  using (current_role_name() = 'officeAdmin')
  with check (current_role_name() = 'officeAdmin');

create or replace function enforce_officeadmin_deal_columns() returns trigger
language plpgsql as $$
begin
  if current_role_name() = 'officeAdmin' then
    if NEW.property is distinct from OLD.property
      or NEW.suburb is distinct from OLD.suburb
      or NEW.month is distinct from OLD.month
      or NEW.asking_price is distinct from OLD.asking_price
      or NEW.opening_offer is distinct from OLD.opening_offer
      or NEW.agreed_offer is distinct from OLD.agreed_offer
      or NEW.com_percent is distinct from OLD.com_percent
      or NEW.confirmed_commission is distinct from OLD.confirmed_commission
      or NEW.agent_id is distinct from OLD.agent_id
      or NEW.listing_agent_id is distinct from OLD.listing_agent_id
      or NEW.shared_with_agent_id is distinct from OLD.shared_with_agent_id
      or NEW.shared_split is distinct from OLD.shared_split
      or NEW.shared_deal is distinct from OLD.shared_deal
      or NEW.deal_tier is distinct from OLD.deal_tier
      or NEW.condition_status is distinct from OLD.condition_status
      or NEW.conditions is distinct from OLD.conditions
      or NEW.bond_through is distinct from OLD.bond_through
      or NEW.bond_applying_for is distinct from OLD.bond_applying_for
      or NEW.attorney is distinct from OLD.attorney
      or NEW.co_seller is distinct from OLD.co_seller
      or NEW.co_buyers is distinct from OLD.co_buyers
      or NEW.cco is distinct from OLD.cco
      or NEW.suspensive is distinct from OLD.suspensive
      or NEW.fall_out is distinct from OLD.fall_out
      or NEW.kre_nett_confirmed is distinct from OLD.kre_nett_confirmed
      or NEW.kre_nett_sus is distinct from OLD.kre_nett_sus
      or NEW.nett_to_kre is distinct from OLD.nett_to_kre
      or NEW.still_to_register is distinct from OLD.still_to_register
      or NEW.exp_reg_date is distinct from OLD.exp_reg_date
      or NEW.registered is distinct from OLD.registered
      or NEW.registered_date is distinct from OLD.registered_date
    then
      raise exception 'Office Admin can only update OTP status/files and buyer/seller contact fields on deals';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_enforce_officeadmin_deal_columns on deals;
create trigger trg_enforce_officeadmin_deal_columns
  before update on deals
  for each row execute function enforce_officeadmin_deal_columns();

create policy "deal_activity_admin_all" on deal_activity for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
create policy "deal_activity_agent_own" on deal_activity for all
  using (current_role_name() = 'agent' and exists (
    select 1 from deals d where d.id = deal_activity.deal_id
      and (d.agent_id = current_agent_id() or d.listing_agent_id = current_agent_id() or d.shared_with_agent_id = current_agent_id())))
  with check (current_role_name() = 'agent' and exists (
    select 1 from deals d where d.id = deal_activity.deal_id
      and (d.agent_id = current_agent_id() or d.listing_agent_id = current_agent_id() or d.shared_with_agent_id = current_agent_id())));
create policy "deal_activity_officeadmin_select" on deal_activity for select
  using (current_role_name() = 'officeAdmin');

create policy "deal_transfer_steps_admin_all" on deal_transfer_steps for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
create policy "deal_transfer_steps_agent_own" on deal_transfer_steps for all
  using (current_role_name() = 'agent' and exists (
    select 1 from deals d where d.id = deal_transfer_steps.deal_id
      and (d.agent_id = current_agent_id() or d.listing_agent_id = current_agent_id() or d.shared_with_agent_id = current_agent_id())))
  with check (current_role_name() = 'agent' and exists (
    select 1 from deals d where d.id = deal_transfer_steps.deal_id
      and (d.agent_id = current_agent_id() or d.listing_agent_id = current_agent_id() or d.shared_with_agent_id = current_agent_id())));
create policy "deal_transfer_steps_officeadmin_select" on deal_transfer_steps for select
  using (current_role_name() = 'officeAdmin');

-- canvassing (records, notes, valuations)
create policy "canvassing_records_admin_all" on canvassing_records for all
  using (current_role_name() in ('masterAdmin','officeManager','officeAdmin'))
  with check (current_role_name() in ('masterAdmin','officeManager','officeAdmin'));
create policy "canvassing_records_agent_own" on canvassing_records for all
  using (current_role_name() = 'agent' and broker_id = current_agent_id())
  with check (current_role_name() = 'agent' and broker_id = current_agent_id());

create policy "canvassing_notes_admin_all" on canvassing_notes for all
  using (current_role_name() in ('masterAdmin','officeManager','officeAdmin'))
  with check (current_role_name() in ('masterAdmin','officeManager','officeAdmin'));
create policy "canvassing_notes_agent_own" on canvassing_notes for all
  using (current_role_name() = 'agent' and exists (
    select 1 from canvassing_records r where r.id = canvassing_notes.record_id and r.broker_id = current_agent_id()))
  with check (current_role_name() = 'agent' and exists (
    select 1 from canvassing_records r where r.id = canvassing_notes.record_id and r.broker_id = current_agent_id()));

create policy "canvassing_valuations_admin_all" on canvassing_valuations for all
  using (current_role_name() in ('masterAdmin','officeManager','officeAdmin'))
  with check (current_role_name() in ('masterAdmin','officeManager','officeAdmin'));
create policy "canvassing_valuations_agent_own" on canvassing_valuations for all
  using (current_role_name() = 'agent' and exists (
    select 1 from canvassing_records r where r.id = canvassing_valuations.canvassing_record_id and r.broker_id = current_agent_id()))
  with check (current_role_name() = 'agent' and exists (
    select 1 from canvassing_records r where r.id = canvassing_valuations.canvassing_record_id and r.broker_id = current_agent_id()));

-- contacts: masterAdmin/officeManager/officeAdmin only
create policy "contacts_admin" on contacts for all
  using (current_role_name() in ('masterAdmin','officeManager','officeAdmin'))
  with check (current_role_name() in ('masterAdmin','officeManager','officeAdmin'));

-- todos: any authenticated user can create a todo for any agent (routine
-- cross-assignment — canvas number-requests and OTP tasks go to the Admin
-- Agent, merge-review/campaign-lead todos go to a different agent than the
-- one creating them) but can only read/update/delete their own; admin/OM
-- see and manage all.
create policy "todos_insert_any" on todos for insert
  with check (auth.uid() is not null);
create policy "todos_own_rw" on todos for select
  using (agent_id = current_agent_id());
create policy "todos_own_update" on todos for update
  using (agent_id = current_agent_id())
  with check (agent_id = current_agent_id());
create policy "todos_own_delete" on todos for delete
  using (agent_id = current_agent_id());
create policy "todos_admin_all" on todos for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

-- listings: read-all for any authenticated user with a nav-visible role, write = admin/OM
create policy "listings_select_all" on listings for select using (auth.uid() is not null);
create policy "listings_write_admin" on listings for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

-- attorneys: read-all, write = admin/OM
create policy "attorneys_select_all" on attorneys for select using (auth.uid() is not null);
create policy "attorneys_write_admin" on attorneys for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));

-- agent_targets: admin/OM full; agent read-own
create policy "agent_targets_admin_all" on agent_targets for all
  using (current_role_name() in ('masterAdmin','officeManager'))
  with check (current_role_name() in ('masterAdmin','officeManager'));
create policy "agent_targets_agent_read_own" on agent_targets for select
  using (current_role_name() = 'agent' and agent_id = current_agent_id());

-- marketing tables: masterAdmin/officeManager/marketing only
create policy "marketing_budgets_admin" on marketing_budgets for all
  using (current_role_name() in ('masterAdmin','officeManager','marketing'))
  with check (current_role_name() in ('masterAdmin','officeManager','marketing'));
create policy "marketing_campaigns_admin" on marketing_campaigns for all
  using (current_role_name() in ('masterAdmin','officeManager','marketing'))
  with check (current_role_name() in ('masterAdmin','officeManager','marketing'));
create policy "campaign_brokers_admin" on campaign_brokers for all
  using (current_role_name() in ('masterAdmin','officeManager','marketing'))
  with check (current_role_name() in ('masterAdmin','officeManager','marketing'));
create policy "marketing_broker_rotation_admin" on marketing_broker_rotation for all
  using (current_role_name() in ('masterAdmin','officeManager','marketing'))
  with check (current_role_name() in ('masterAdmin','officeManager','marketing'));

-- role_permissions / role_deal_columns: read-all, write masterAdmin only
create policy "role_permissions_select_all" on role_permissions for select using (auth.uid() is not null);
create policy "role_permissions_write_masteradmin" on role_permissions for all
  using (current_role_name() = 'masterAdmin')
  with check (current_role_name() = 'masterAdmin');
create policy "role_deal_columns_select_all" on role_deal_columns for select using (auth.uid() is not null);
create policy "role_deal_columns_write_masteradmin" on role_deal_columns for all
  using (current_role_name() = 'masterAdmin')
  with check (current_role_name() = 'masterAdmin');

-- ---------------------------------------------------------------------
-- 7. Storage buckets + policies (OTP/comm-statement/valuation PDFs)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
  values ('deal-documents', 'deal-documents', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('canvassing-valuations', 'canvassing-valuations', false)
  on conflict (id) do nothing;

drop policy if exists "deal_documents_admin_all" on storage.objects;
create policy "deal_documents_admin_all" on storage.objects for all
  using (bucket_id = 'deal-documents' and current_role_name() in ('masterAdmin','officeManager','officeAdmin'))
  with check (bucket_id = 'deal-documents' and current_role_name() in ('masterAdmin','officeManager','officeAdmin'));

drop policy if exists "deal_documents_agent_own" on storage.objects;
create policy "deal_documents_agent_own" on storage.objects for all
  using (
    bucket_id = 'deal-documents'
    and current_role_name() = 'agent'
    and exists (
      select 1 from deals d
      where d.id::text = (storage.foldername(name))[2]
        and (d.agent_id = current_agent_id() or d.listing_agent_id = current_agent_id() or d.shared_with_agent_id = current_agent_id())
    )
  )
  with check (
    bucket_id = 'deal-documents'
    and current_role_name() = 'agent'
    and exists (
      select 1 from deals d
      where d.id::text = (storage.foldername(name))[2]
        and (d.agent_id = current_agent_id() or d.listing_agent_id = current_agent_id() or d.shared_with_agent_id = current_agent_id())
    )
  );

drop policy if exists "canvassing_valuations_storage_admin_all" on storage.objects;
create policy "canvassing_valuations_storage_admin_all" on storage.objects for all
  using (bucket_id = 'canvassing-valuations' and current_role_name() in ('masterAdmin','officeManager','officeAdmin'))
  with check (bucket_id = 'canvassing-valuations' and current_role_name() in ('masterAdmin','officeManager','officeAdmin'));

drop policy if exists "canvassing_valuations_storage_agent_own" on storage.objects;
create policy "canvassing_valuations_storage_agent_own" on storage.objects for all
  using (
    bucket_id = 'canvassing-valuations'
    and current_role_name() = 'agent'
    and exists (
      select 1 from canvassing_records r
      where r.id::text = (storage.foldername(name))[2] and r.broker_id = current_agent_id()
    )
  )
  with check (
    bucket_id = 'canvassing-valuations'
    and current_role_name() = 'agent'
    and exists (
      select 1 from canvassing_records r
      where r.id::text = (storage.foldername(name))[2] and r.broker_id = current_agent_id()
    )
  );

-- ---------------------------------------------------------------------
-- 8. Bootstrap: creating your FIRST masterAdmin
--
-- The in-app "Pending Users" approval flow (list_pending_users/approve_user)
-- only works once a masterAdmin already exists to do the approving — so the
-- very first account has to be linked by hand, once, here in the SQL
-- editor. Every account after this one can go through the normal in-app
-- flow instead.
--
-- 1. In the Supabase dashboard, go to Authentication and create a user
--    (email + password) for yourself.
-- 2. Copy that user's UUID from the Authentication > Users list.
-- 3. Uncomment and run the line below with that UUID:
--
-- insert into user_profiles (id, role, agent_id)
--   values ('paste-the-uuid-here', 'masterAdmin', null);
-- ---------------------------------------------------------------------
