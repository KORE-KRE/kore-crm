-- KORE CRM — schema_v11.sql
-- masterAdmin-only RPC returning every auth account (email included) with
-- whatever role/agent link it has, if any — supersedes list_pending_users
-- for the Access Control page, and finally gives the "Linked users" panel
-- real email addresses instead of a truncated UUID, which is what an
-- admin-triggered password reset needs to actually send anywhere.

create or replace function list_all_users()
returns table (id uuid, email text, created_at timestamptz, role text, agent_id text)
language plpgsql security definer set search_path = public as $$
begin
  if (select role from user_profiles where id = auth.uid()) <> 'masterAdmin' then
    raise exception 'not authorized';
  end if;
  return query
    select u.id, u.email, u.created_at, p.role, p.agent_id
    from auth.users u
    left join user_profiles p on p.id = u.id
    order by u.created_at desc;
end;
$$;

revoke all on function list_all_users() from public;
grant execute on function list_all_users() to authenticated;
