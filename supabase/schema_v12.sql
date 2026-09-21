-- KORE CRM — schema_v12.sql
-- deals.js has always sent buyer_name/seller_name (alongside the
-- buyer_email/seller_email columns that DO exist) — those two columns
-- were simply never added to the deals table in an earlier migration.
-- This is the actual cause of "Could not find the 'buyer_name' column
-- of 'deals' in the schema cache" when converting an offer to a deal.

alter table deals
  add column if not exists buyer_name text,
  add column if not exists seller_name text;
