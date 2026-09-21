import { supabase } from "../supabaseClient.js";

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, role, agent_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase.from("user_profiles").select("id, role, agent_id");
  if (error) throw error;
  return data;
}

export async function fetchPendingUsers() {
  const { data, error } = await supabase.rpc("list_pending_users");
  if (error) throw error;
  return data;
}

export async function fetchAllUsers() {
  const { data, error } = await supabase.rpc("list_all_users");
  if (error) throw error;
  return data;
}

export async function approveUser(targetId, role, agentId) {
  const { error } = await supabase.rpc("approve_user", {
    target_id: targetId,
    target_role: role,
    target_agent_id: agentId || null,
  });
  if (error) throw error;
}

export async function updateUserRole(targetId, role, agentId) {
  const { error } = await supabase.rpc("update_user_role", {
    target_id: targetId,
    target_role: role,
    target_agent_id: agentId || null,
  });
  if (error) throw error;
}

export async function deleteUserAccount(targetId) {
  const { error } = await supabase.rpc("delete_user_account", { target_id: targetId });
  if (error) throw error;
}

export async function inviteUser(email, role, agentId) {
  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: { email, role, agentId: agentId || null },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
