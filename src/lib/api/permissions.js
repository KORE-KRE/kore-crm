import { supabase } from "../supabaseClient.js";

export async function fetchRolePermissions() {
  const { data, error } = await supabase.from("role_permissions").select("*");
  if (error) throw error;
  const byRole = {};
  data.forEach((row) => {
    byRole[row.role] = byRole[row.role] || {};
    byRole[row.role][row.nav_key] = row.allowed;
  });
  return byRole;
}

export async function togglePermission(role, navKey, allowed) {
  const { error } = await supabase
    .from("role_permissions")
    .upsert({ role, nav_key: navKey, allowed }, { onConflict: "role,nav_key" });
  if (error) throw error;
}

export async function fetchRoleDealColumns() {
  const { data, error } = await supabase.from("role_deal_columns").select("*");
  if (error) throw error;
  const byRole = {};
  data.forEach((row) => {
    byRole[row.role] = byRole[row.role] || [];
    byRole[row.role].push(row.column_key);
  });
  return byRole;
}

export async function toggleRoleColumn(role, columnKey, hidden) {
  if (hidden) {
    const { error } = await supabase.from("role_deal_columns").insert({ role, column_key: columnKey });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("role_deal_columns").delete().eq("role", role).eq("column_key", columnKey);
    if (error) throw error;
  }
}
