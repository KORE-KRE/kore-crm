-- KORE CRM — schema_v3.sql
-- Additive migration on top of schema.sql + schema_v2.sql. Run this AFTER
-- both of those. Adds agent management: title/photo/status(tier), the
-- initial 13-agent seed (previously reseeded from the client on every
-- masterAdmin login — moved here as a one-time seed so removing an agent
-- in the app actually sticks instead of reappearing on next load), a
-- storage bucket for agent photos, and RLS restricting add/remove/status
-- changes to masterAdmin only.

-- ---------------------------------------------------------------------
-- 1. New columns on agents
-- ---------------------------------------------------------------------

alter table agents
  add column if not exists title text,
  add column if not exists photo_path text,
  add column if not exists tier text not null default 'Yellow';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'agents_tier_check'
  ) then
    alter table agents
      add constraint agents_tier_check check (tier in ('Yellow', 'Blue', 'Silver', 'Gold'));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. One-time seed of the original roster (safe to re-run — only fills
--    in rows that don't already exist, so a removed agent stays removed)
-- ---------------------------------------------------------------------

insert into agents (id, name, initials, office, tier) values
  ('a1', 'Alyassa', 'AL', 'Benoni Office', 'Yellow'),
  ('a2', 'Ashton', 'AS', 'Benoni Office', 'Yellow'),
  ('a3', 'Bronwyn', 'BR', 'Benoni Office', 'Yellow'),
  ('a4', 'Chevaughn', 'CH', 'Benoni Office', 'Yellow'),
  ('a5', 'Kaylee', 'KA', 'Benoni Office', 'Yellow'),
  ('a6', 'Lauren', 'LA', 'Benoni Office', 'Yellow'),
  ('a7', 'Leonard', 'LE', 'Benoni Office', 'Yellow'),
  ('a8', 'Mike W', 'MW', 'Benoni Office', 'Yellow'),
  ('a9', 'Nicole McG', 'NM', 'Benoni Office', 'Yellow'),
  ('a10', 'Nicole W', 'NW', 'Benoni Office', 'Yellow'),
  ('a11', 'Rox Ann', 'RA', 'Benoni Office', 'Yellow'),
  ('a12', 'Tshepo', 'TS', 'Benoni Office', 'Yellow'),
  ('a13', 'Logan', 'LO', 'Benoni Office', 'Yellow')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. Storage bucket for agent photos (public read — profile pictures,
--    not confidential documents; write restricted to masterAdmin below)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
  values ('agent-photos', 'agent-photos', true)
  on conflict (id) do nothing;

drop policy if exists "agent_photos_read_all" on storage.objects;
create policy "agent_photos_read_all" on storage.objects for select
  using (bucket_id = 'agent-photos');

drop policy if exists "agent_photos_write_masteradmin" on storage.objects;
create policy "agent_photos_write_masteradmin" on storage.objects for all
  using (bucket_id = 'agent-photos' and current_role_name() = 'masterAdmin')
  with check (bucket_id = 'agent-photos' and current_role_name() = 'masterAdmin');

-- ---------------------------------------------------------------------
-- 4. RLS: add/remove agents and status(tier) changes are masterAdmin
--    only. Ordinary field edits (title/cell/email) stay available to
--    officeManager too, matching existing behaviour on the Agents page.
-- ---------------------------------------------------------------------

drop policy if exists "agents_write_admin" on agents;
create policy "agents_update_admin" on agents for update
  using (current_role_name() in ('masterAdmin', 'officeManager'))
  with check (current_role_name() in ('masterAdmin', 'officeManager'));
create policy "agents_insert_masteradmin" on agents for insert
  with check (current_role_name() = 'masterAdmin');
create policy "agents_delete_masteradmin" on agents for delete
  using (current_role_name() = 'masterAdmin');

create or replace function enforce_masteradmin_agent_tier() returns trigger
language plpgsql as $$
begin
  if NEW.tier is distinct from OLD.tier and current_role_name() <> 'masterAdmin' then
    raise exception 'Only Master Admin can change an agent''s status';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_enforce_masteradmin_agent_tier on agents;
create trigger trg_enforce_masteradmin_agent_tier
  before update on agents
  for each row execute function enforce_masteradmin_agent_tier();
