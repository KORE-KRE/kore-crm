-- KORE CRM — schema_v6.sql
-- Performance fix: several RLS policies filter/subquery on foreign-key
-- columns that were never indexed (Postgres does NOT auto-index FK
-- columns, only primary keys). Under real data volume + the dashboard's
-- ~17 parallel queries on load, this was enough to trip Postgres's
-- statement timeout ("canceling statement due to statement timeout").
-- Adding indexes doesn't change any query results, only how fast they run.
-- Safe to run anytime, safe to re-run.

create index if not exists idx_leads_agent_id on leads (agent_id);
create index if not exists idx_lead_activity_lead_id on lead_activity (lead_id);
create index if not exists idx_lead_collaborators_agent_id on lead_collaborators (agent_id);
create index if not exists idx_lead_merge_requests_requesting_agent_id on lead_merge_requests (requesting_agent_id);

create index if not exists idx_offers_agent_id on offers (agent_id);
create index if not exists idx_offers_listing_agent_id on offers (listing_agent_id);
create index if not exists idx_offers_shared_with_agent_id on offers (shared_with_agent_id);
create index if not exists idx_offer_activity_offer_id on offer_activity (offer_id);

create index if not exists idx_deals_agent_id on deals (agent_id);
create index if not exists idx_deals_listing_agent_id on deals (listing_agent_id);
create index if not exists idx_deals_shared_with_agent_id on deals (shared_with_agent_id);
create index if not exists idx_deal_activity_deal_id on deal_activity (deal_id);

create index if not exists idx_canvassing_records_broker_id on canvassing_records (broker_id);
create index if not exists idx_canvassing_notes_record_id on canvassing_notes (record_id);
create index if not exists idx_canvassing_valuations_record_id on canvassing_valuations (canvassing_record_id);

create index if not exists idx_todos_agent_id on todos (agent_id);

-- Make sure the planner picks these up immediately rather than waiting
-- for the next autovacuum analyze cycle.
analyze leads;
analyze lead_activity;
analyze lead_collaborators;
analyze lead_merge_requests;
analyze offers;
analyze offer_activity;
analyze deals;
analyze deal_activity;
analyze canvassing_records;
analyze canvassing_notes;
analyze canvassing_valuations;
analyze todos;
