-- KORE CRM — schema_v4.sql
-- Additive migration on top of schema.sql + schema_v2.sql + schema_v3.sql.
-- Adds the ability for masterAdmin to remove a login account entirely
-- (not just unlink their role) — without a service_role key, using the
-- same security-definer pattern as list_pending_users/approve_user, which
-- already proved that a definer function can operate on auth.users in
-- this project.

create or replace function delete_user_account(target_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select role from user_profiles where id = auth.uid()) <> 'masterAdmin' then
    raise exception 'not authorized';
  end if;
  if target_id = auth.uid() then
    raise exception 'You cannot remove your own account';
  end if;
  -- user_profiles.id references auth.users(id) on delete cascade, so the
  -- profile row (if any) is cleaned up automatically by this delete.
  delete from auth.users where id = target_id;
end;
$$;

revoke all on function delete_user_account(uuid) from public;
grant execute on function delete_user_account(uuid) to authenticated;
