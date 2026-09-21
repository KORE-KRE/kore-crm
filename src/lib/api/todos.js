import { supabase } from "../supabaseClient.js";

function rowToTodo(r) {
  return {
    id: r.id, agentId: r.agent_id, kind: r.kind, label: r.label, done: r.done,
    leadId: r.lead_id, dealId: r.deal_id, offerId: r.offer_id, canvassingRecordId: r.canvassing_record_id,
    createdAt: r.created_at, dueDate: r.due_date || null,
  };
}

export async function fetchTodos() {
  const { data, error } = await supabase.from("todos").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToTodo);
}

export async function addTodo({ agentId, kind, label, leadId, dealId, offerId, canvassingRecordId, dueDate }) {
  const { data, error } = await supabase
    .from("todos")
    .insert({
      agent_id: agentId, kind, label, done: false,
      lead_id: leadId || null, deal_id: dealId || null, offer_id: offerId || null,
      canvassing_record_id: canvassingRecordId || null, due_date: dueDate || null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToTodo(data);
}

export async function toggleTodo(id, done) {
  const { data, error } = await supabase.from("todos").update({ done }).eq("id", id).select().single();
  if (error) throw error;
  return rowToTodo(data);
}
