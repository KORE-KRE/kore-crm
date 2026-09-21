import { supabase } from "../supabaseClient.js";

function rowToAgent(a) {
  const photoUrl = a.photo_path
    ? supabase.storage.from("agent-photos").getPublicUrl(a.photo_path).data.publicUrl
    : "";
  return {
    id: a.id, name: a.name, initials: a.initials, office: a.office,
    cell: a.cell || "", email: a.email || "", title: a.title || "",
    tier: a.tier || "Yellow", photoPath: a.photo_path || "", photoUrl,
    active: a.active !== false, excludeFromLeaderboard: !!a.exclude_from_leaderboard,
  };
}

export async function fetchAgents() {
  const { data, error } = await supabase.from("agents").select("*").order("name");
  if (error) throw error;
  // "admin-agent" has a real row (todos.agent_id needs it to exist as a
  // valid FK target) but was never meant to appear in the roster itself —
  // it's a task-recipient identity, not a real salesperson.
  return data.filter((a) => a.id !== "admin-agent").map(rowToAgent);
}

export async function updateAgentContact(id, { cell, email }) {
  const { data, error } = await supabase
    .from("agents")
    .update({ cell, email })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToAgent(data);
}

export async function upsertAgents(agents) {
  const rows = agents.map((a) => ({ id: a.id, name: a.name, initials: a.initials, office: a.office }));
  const { error } = await supabase.from("agents").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function createAgent({ id, name, initials, office, title, cell, email, tier }) {
  const { data, error } = await supabase
    .from("agents")
    .insert({ id, name, initials, office, title, cell, email, tier: tier || "Yellow" })
    .select()
    .single();
  if (error) throw error;
  return rowToAgent(data);
}

export async function updateAgent(id, patch) {
  const { data, error } = await supabase.from("agents").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return rowToAgent(data);
}

export async function updateAgentTier(id, tier) {
  return updateAgent(id, { tier });
}

export async function deleteAgent(id) {
  const { error } = await supabase.from("agents").delete().eq("id", id);
  if (error) throw error;
}

export async function setAgentStatus(agentId, active) {
  const { data, error } = await supabase.functions.invoke("set-agent-status", {
    body: { agentId, active },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function uploadAgentPhoto(agentId, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `agents/${agentId}/photo.${ext}`;
  const { error: uploadError } = await supabase.storage.from("agent-photos").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  return updateAgent(agentId, { photo_path: path });
}
