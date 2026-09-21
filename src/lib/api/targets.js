import { supabase } from "../supabaseClient.js";

export async function fetchTargets() {
  const { data, error } = await supabase.from("agent_targets").select("*");
  if (error) throw error;
  const byYear = {};
  data.forEach((row) => {
    const year = String(row.year);
    byYear[year] = byYear[year] || {};
    byYear[year][row.agent_id] = Number(row.amount);
  });
  return byYear;
}

export async function setTarget(agentId, year, amount) {
  const { data, error } = await supabase
    .from("agent_targets")
    .upsert({ agent_id: agentId, year: Number(year), amount }, { onConflict: "agent_id,year" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
