import { supabase } from "../supabaseClient.js";

export async function fetchAttorneys() {
  const { data, error } = await supabase.from("attorneys").select("*").order("name");
  if (error) throw error;
  return data.map((a) => ({
    name: a.name, contactName: a.contact_name || "", email: a.email || "", phone: a.phone || "",
  }));
}

export async function upsertAttorneyNames(names) {
  const rows = names.map((name) => ({ name }));
  const { error } = await supabase.from("attorneys").upsert(rows, { onConflict: "name", ignoreDuplicates: true });
  if (error) throw error;
}

export async function upsertAttorney({ name, contactName, email, phone }) {
  const { data, error } = await supabase
    .from("attorneys")
    .upsert({ name, contact_name: contactName, email, phone }, { onConflict: "name" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
