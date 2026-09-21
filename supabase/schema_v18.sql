-- KORE CRM — schema_v18.sql
-- Microsoft To Do integration: each user can link their own Microsoft
-- account so KORE tasks get pushed into their To Do app (one-way —
-- creating/completing a task in KORE pushes to Microsoft; edits made
-- directly in Microsoft To Do do not flow back).
--
-- Tokens are only ever touched by Edge Functions using the service_role
-- key (never the browser), so this table intentionally gets NO RLS
-- policies for the `authenticated` role at all — with RLS enabled and
-- zero policies, every client-side query against it returns nothing,
-- and only service-role requests (server-side only) can read or write it.
create table if not exists ms_todo_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  ms_email text,
  todo_list_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table ms_todo_connections enable row level security;

alter table todos add column if not exists ms_todo_task_id text;
alter table todos add column if not exists ms_todo_list_id text;

-- Safe, narrow status check the client can call directly — never returns
-- the tokens themselves, just whether a connection exists and which
-- Microsoft account it's linked to.
create or replace function get_ms_todo_status()
returns table(connected boolean, ms_email text)
language plpgsql security definer set search_path = public as $$
declare
  rec record;
begin
  select c.ms_email into rec from ms_todo_connections c where c.user_id = auth.uid();
  if found then
    return query select true, rec.ms_email;
  else
    return query select false, null::text;
  end if;
end; $$;
grant execute on function get_ms_todo_status() to authenticated;

create or replace function disconnect_ms_todo()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from ms_todo_connections where user_id = auth.uid();
end; $$;
grant execute on function disconnect_ms_todo() to authenticated;
