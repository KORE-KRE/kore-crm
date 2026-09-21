import { supabase } from "../supabaseClient.js";

function rowToContact(r) {
  return { id: r.id, category: r.category, name: r.name, phone: r.phone || "", email: r.email || "", address: r.address || "", notes: r.notes || "" };
}

export async function fetchContacts() {
  const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToContact);
}

export async function addContact({ category, name, phone, email, address, notes }) {
  const { data, error } = await supabase
    .from("contacts")
    .insert({ category, name, phone, email, address, notes })
    .select()
    .single();
  if (error) throw error;
  return rowToContact(data);
}

export async function updateContact(id, { category, name, phone, email, address, notes }) {
  const { data, error } = await supabase
    .from("contacts")
    .update({ category, name, phone, email, address, notes })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToContact(data);
}
