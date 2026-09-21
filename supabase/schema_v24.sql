-- KORE CRM — schema_v24.sql
-- Rentals targets: add a yearly Gross Commission Target (Rand, ex VAT) on
-- Finder's Fee per rental agent, alongside the existing managed-deals
-- headcount target already on this table. Same row, second column — one
-- agent/year can carry both a deal-count goal and a Rand goal.

alter table rental_agent_targets add column if not exists commission_target numeric not null default 0;
