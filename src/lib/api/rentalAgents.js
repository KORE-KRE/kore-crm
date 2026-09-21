import { supabase } from "../supabaseClient.js";

function rowToRentalAgent(a) {
  const photoUrl = a.photo_path
    ? supabase.storage.from("agent-photos").getPublicUrl(a.photo_path).data.publicUrl
    : "";
  return {
    id: a.id, name: a.name, initials: a.initials,
    cell: a.cell || "", email: a.email || "", title: a.title || "",
    photoPath: a.photo_path || "", photoUrl, active: a.active !== false,
  };
}

export async function fetchRentalAgents() {
  const { data, error } = await supabase.from("rental_agents").select("*").order("name");
  if (error) throw error;
  return data.map(rowToRentalAgent);
}

export async function createRentalAgent({ id, name, initials, title, cell, email }) {
  const { data, error } = await supabase
    .from("rental_agents")
    .insert({ id, name, initials, title, cell, email })
    .select()
    .single();
  if (error) throw error;
  return rowToRentalAgent(data);
}

export async function updateRentalAgent(id, patch) {
  const { data, error } = await supabase.from("rental_agents").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return rowToRentalAgent(data);
}

export async function deleteRentalAgent(id) {
  const { error } = await supabase.from("rental_agents").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadRentalAgentPhoto(agentId, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `rental-agents/${agentId}/photo.${ext}`;
  const { error: uploadError } = await supabase.storage.from("agent-photos").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  return updateRentalAgent(agentId, { photo_path: path });
}
