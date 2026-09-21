-- KORE CRM — schema_v13.sql
-- "Admin Agent" (id 'admin-agent') is a special task-recipient identity
-- for OTP-send and canvas-number-request todos — by original design it's
-- deliberately NOT a real row in `agents`, so it never shows up in the
-- leaderboard, commission splits, or agent-assignment dropdowns. But
-- todos.agent_id has a foreign key requiring the row to actually exist,
-- which is what's failing right now. Give it a real row so the FK is
-- satisfied — src/lib/api/agents.js filters this specific id back out of
-- what the app actually displays, so the "never shows up in the UI"
-- behavior is unchanged.

insert into agents (id, name, initials, office, tier)
  values ('admin-agent', 'Admin Agent', 'AA', 'Benoni Office', 'Yellow')
  on conflict (id) do nothing;
