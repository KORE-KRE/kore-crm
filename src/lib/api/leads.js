import { supabase } from "../supabaseClient.js";

function rowToLead(r) {
  return {
    id: r.id, name: r.name, phone: r.phone || "", email: r.email || "", source: r.source,
    listingRef: r.listing_ref || "", listingAddress: r.listing_address || "", price: Number(r.price) || 0,
    message: r.message || "", status: r.status, agent: r.agent_id, campaignId: r.campaign_id,
    collaborators: (r.lead_collaborators || []).map((c) => c.agent_id),
    date: new Date(r.created_at),
    activity: (r.lead_activity || [])
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((a) => ({ id: a.id, type: a.type, text: a.text, author: a.author_id, timestamp: new Date(a.created_at) })),
    requirements: r.requirements || {},
  };
}

const SELECT = "*, lead_activity(*), lead_collaborators(*)";

export async function fetchLeads() {
  const { data, error } = await supabase.from("leads").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToLead);
}

export async function createLead(lead) {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: lead.name, phone: lead.phone, email: lead.email, source: lead.source,
      listing_ref: lead.listingRef, listing_address: lead.listingAddress, price: lead.price || null,
      message: lead.message, status: lead.status || "New", agent_id: lead.agent, campaign_id: lead.campaignId || null,
      requirements: lead.requirements || null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return rowToLead(data);
}

export async function bulkInsertLeads(leads) {
  const rows = leads.map((lead) => ({
    name: lead.name, phone: lead.phone, email: lead.email, source: lead.source,
    listing_ref: lead.listingRef, listing_address: lead.listingAddress, price: lead.price || null,
    message: lead.message, status: lead.status || "New", agent_id: lead.agent,
  }));
  const { error } = await supabase.from("leads").insert(rows);
  if (error) throw error;
}

export async function updateLead(id, patch) {
  const { data, error } = await supabase.from("leads").update(patch).eq("id", id).select(SELECT).single();
  if (error) throw error;
  return rowToLead(data);
}

export async function fetchLeadById(id) {
  const { data, error } = await supabase.from("leads").select(SELECT).eq("id", id).single();
  if (error) throw error;
  return rowToLead(data);
}

export async function addActivity(leadId, { type, text, authorId }) {
  const { error } = await supabase.from("lead_activity").insert({ lead_id: leadId, type, text, author_id: authorId });
  if (error) throw error;
  return fetchLeadById(leadId);
}

export async function addCollaborator(leadId, agentId) {
  const { error } = await supabase.from("lead_collaborators").insert({ lead_id: leadId, agent_id: agentId });
  if (error) throw error;
  return fetchLeadById(leadId);
}

export async function removeCollaborator(leadId, agentId) {
  const { error } = await supabase.from("lead_collaborators").delete().eq("lead_id", leadId).eq("agent_id", agentId);
  if (error) throw error;
  return fetchLeadById(leadId);
}

// --- Merge requests ---

function rowToMergeRequest(r) {
  return {
    id: r.id, incoming: { name: r.incoming_name, phone: r.incoming_phone, email: r.incoming_email, message: r.incoming_message, source: r.incoming_source },
    existingLeadId: r.existing_lead_id, requestingAgentId: r.requesting_agent_id, matchedAgentId: r.matched_agent_id,
    status: r.status, matchReason: r.match_reason, createdAt: r.created_at,
  };
}

export async function fetchMergeRequests() {
  const { data, error } = await supabase.from("lead_merge_requests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToMergeRequest);
}

export async function createMergeRequest(mr) {
  const { data, error } = await supabase
    .from("lead_merge_requests")
    .insert({
      incoming_name: mr.incoming.name, incoming_phone: mr.incoming.phone, incoming_email: mr.incoming.email,
      incoming_message: mr.incoming.message, incoming_source: mr.incoming.source,
      existing_lead_id: mr.existingLeadId, requesting_agent_id: mr.requestingAgentId,
      matched_agent_id: mr.matchedAgentId, match_reason: mr.matchReason, status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return rowToMergeRequest(data);
}

export async function resolveMergeRequest(id, status) {
  const { data, error } = await supabase.from("lead_merge_requests").update({ status }).eq("id", id).select().single();
  if (error) throw error;
  return rowToMergeRequest(data);
}

// --- Round-robin allocation log ---

export async function logAllocation({ leadId, agentId, campaignId }) {
  const { error } = await supabase.from("lead_allocations").insert({ lead_id: leadId, agent_id: agentId, campaign_id: campaignId || null });
  if (error) throw error;
}
