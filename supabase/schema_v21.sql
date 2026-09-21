-- KORE CRM — schema_v21.sql
-- Lets a non-broker (e.g. a Director) show up in the Agents/contact
-- directory without being pulled into the Leaderboard or commission
-- tracking, and adds "David Helena, Director" as one.

alter table agents add column if not exists exclude_from_leaderboard boolean not null default false;

insert into agents (id, name, initials, office, title, tier, active, exclude_from_leaderboard)
values ('david-helena', 'David Helena', 'DH', 'Kingstons Real Estate', 'Director', 'Yellow', true, true)
on conflict (id) do nothing;

-- Optional: link your own Master Admin login to this agent record, so
-- anything you create (offers, deals, tasks) is attributed to "David
-- Helena" instead of showing as Unassigned. Uncomment and run separately
-- once you've confirmed the agent row above was created successfully —
-- it looks your account up by email rather than needing your user id.
-- update user_profiles
-- set agent_id = 'david-helena'
-- where id = (select id from auth.users where email = 'davidthelena@gmail.com');
