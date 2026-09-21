-- KORE CRM — schema_v17.sql
-- Contacts become a real, searchable, deduplicated directory linked to
-- Offers and Deals (Purchaser/Seller), instead of just free-text names.
-- Every agent needs to be able to search the whole contacts book (to spot
-- a repeat buyer/seller and avoid duplicate records) even though only
-- admin roles could previously read the table at all.

alter table offers add column if not exists buyer_contact_id uuid references contacts(id) on delete set null;
alter table offers add column if not exists seller_contact_id uuid references contacts(id) on delete set null;
alter table deals add column if not exists buyer_contact_id uuid references contacts(id) on delete set null;
alter table deals add column if not exists seller_contact_id uuid references contacts(id) on delete set null;

create index if not exists offers_buyer_contact_idx on offers(buyer_contact_id);
create index if not exists offers_seller_contact_idx on offers(seller_contact_id);
create index if not exists deals_buyer_contact_idx on deals(buyer_contact_id);
create index if not exists deals_seller_contact_idx on deals(seller_contact_id);

-- Previously: contacts_admin covered select/insert/update/delete for
-- masterAdmin/officeManager/officeAdmin only. Split it up — every
-- authenticated user can now search and create contacts (needed to
-- dedupe while adding a buyer/seller on an offer or deal); editing and
-- deleting existing records stays admin-only to avoid careless overwrites
-- of a shared record.
drop policy if exists "contacts_admin" on contacts;

create policy "contacts_select_all" on contacts for select
  using (auth.uid() is not null);
create policy "contacts_insert_all" on contacts for insert
  with check (auth.uid() is not null);
create policy "contacts_update_admin" on contacts for update
  using (current_role_name() in ('masterAdmin','officeManager','officeAdmin'))
  with check (current_role_name() in ('masterAdmin','officeManager','officeAdmin'));
create policy "contacts_delete_admin" on contacts for delete
  using (current_role_name() in ('masterAdmin','officeManager','officeAdmin'));
