import { supabase } from "../supabaseClient.js";

export async function fetchRentalTargets() {
  const { data, error } = await supabase.from("rental_agent_targets").select("*");
  if (error) throw error;
  const byYear = {};
  data.forEach((row) => {
    const year = String(row.year);
    byYear[year] = byYear[year] || {};
    byYear[year][row.agent_id] = {
      managedDeals: Number(row.managed_deals_target) || 0,
      commission: Number(row.commission_target) || 0,
    };
  });
  return byYear;
}

export async function setRentalTarget(agentId, year, count) {
  const { data, error } = await supabase
    .from("rental_agent_targets")
    .upsert({ agent_id: agentId, year: String(year), managed_deals_target: count }, { onConflict: "agent_id,year" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setRentalCommissionTarget(agentId, year, amount) {
  const { data, error } = await supabase
    .from("rental_agent_targets")
    .upsert({ agent_id: agentId, year: String(year), commission_target: amount }, { onConflict: "agent_id,year" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
