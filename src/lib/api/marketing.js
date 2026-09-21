import { supabase } from "../supabaseClient.js";

function rowToBudget(r) {
  return {
    id: r.id, name: r.name, platform: r.platform, sector: r.sector,
    startDate: r.start_date, endDate: r.end_date, budget: Number(r.budget) || 0, archived: r.archived,
  };
}

export async function fetchBudgets() {
  const { data, error } = await supabase.from("marketing_budgets").select("*").order("start_date", { ascending: false });
  if (error) throw error;
  return data.map(rowToBudget);
}

export async function updateBudget(id, patch) {
  const { data, error } = await supabase.from("marketing_budgets").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return rowToBudget(data);
}

export async function addBudget(budget) {
  const { data, error } = await supabase
    .from("marketing_budgets")
    .insert({
      name: budget.name, platform: budget.platform, sector: budget.sector,
      start_date: budget.startDate || null, end_date: budget.endDate || null, budget: budget.budget,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToBudget(data);
}

function rowToCampaign(r) {
  return {
    id: r.id, name: r.name, budgetId: r.budget_id, platform: r.platform, sector: r.sector, area: r.area,
    status: r.status, spend: Number(r.spend) || 0, allocation: Number(r.allocation) || 0,
    startDate: r.start_date, endDate: r.end_date, archived: r.archived, notes: r.notes || "",
    brokers: (r.campaign_brokers || []).map((b) => b.agent_id),
  };
}

const CAMPAIGN_SELECT = "*, campaign_brokers(*)";

export async function fetchCampaigns() {
  const { data, error } = await supabase.from("marketing_campaigns").select(CAMPAIGN_SELECT).order("start_date", { ascending: false });
  if (error) throw error;
  return data.map(rowToCampaign);
}

export async function saveCampaign(campaign) {
  const row = {
    name: campaign.name, budget_id: campaign.budgetId || null, platform: campaign.platform, sector: campaign.sector,
    area: campaign.area, status: campaign.status, spend: campaign.spend || 0, allocation: campaign.allocation || 0,
    start_date: campaign.startDate || null, end_date: campaign.endDate || null, notes: campaign.notes,
    archived: campaign.archived || false,
  };
  let campaignId = campaign.id;
  if (campaignId) {
    const { error } = await supabase.from("marketing_campaigns").update(row).eq("id", campaignId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("marketing_campaigns").insert(row).select().single();
    if (error) throw error;
    campaignId = data.id;
  }
  await supabase.from("campaign_brokers").delete().eq("campaign_id", campaignId);
  if (campaign.brokers?.length) {
    const { error } = await supabase.from("campaign_brokers").insert(campaign.brokers.map((agentId) => ({ campaign_id: campaignId, agent_id: agentId })));
    if (error) throw error;
  }
  const { data, error } = await supabase.from("marketing_campaigns").select(CAMPAIGN_SELECT).eq("id", campaignId).single();
  if (error) throw error;
  return rowToCampaign(data);
}

export async function fetchRotation() {
  // .maybeSingle() instead of .single() — this table only ever holds one
  // row (id=1), but if that seed row is ever missing, .single() throws
  // instead of just telling us there's no rotation configured yet.
  const { data, error } = await supabase.from("marketing_broker_rotation").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return { agentIds: data?.agent_ids || [], cursor: data?.cursor || 0 };
}

export async function saveRotation({ agentIds, cursor }) {
  // upsert, not update — guarantees the singleton row exists even if the
  // original seed insert never landed, instead of a silent no-op update.
  const { error } = await supabase.from("marketing_broker_rotation").upsert({ id: 1, agent_ids: agentIds, cursor });
  if (error) throw error;
}

export async function fetchAllocations() {
  const { data, error } = await supabase.from("lead_allocations").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((a) => ({ id: a.id, leadId: a.lead_id, agentId: a.agent_id, campaignId: a.campaign_id, timestamp: a.created_at }));
}
