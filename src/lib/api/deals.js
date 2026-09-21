import { supabase } from "../supabaseClient.js";

function rowToDeal(r) {
  return {
    id: r.id, leadId: r.lead_id, offerId: r.offer_id, month: r.month || "", property: r.property || "",
    suburb: r.suburb || "", askingPrice: Number(r.asking_price) || 0, openingOffer: Number(r.opening_offer) || 0,
    conditions: r.conditions || "", bondApplyingFor: Number(r.bond_applying_for) || 0, bondThrough: r.bond_through || "",
    att: r.attorney || "", coSeller: r.co_seller ?? "", coBuyers: r.co_buyers ?? "", cco: r.cco || "",
    agreedOffer: Number(r.agreed_offer) || 0, sharedDeal: r.shared_deal || "", comPercent: Number(r.com_percent) || 0,
    confirmedCommission: Number(r.confirmed_commission) || 0, suspensive: Number(r.suspensive) || 0,
    fallOut: Number(r.fall_out) || 0, kreNettConfirmed: Number(r.kre_nett_confirmed) || 0,
    kreNettSus: Number(r.kre_nett_sus) || 0, nettToKRE: Number(r.nett_to_kre) || 0,
    stillToRegister: r.still_to_register || "", expRegDate: r.exp_reg_date || "", dealStatus: r.deal_tier || "",
    agent: r.agent_id, listingAgent: r.listing_agent_id, sharedWithAgent: r.shared_with_agent_id || "",
    sharedSplit: r.shared_split || "", conditionStatus: r.condition_status || "",
    registered: r.registered, registeredDate: r.registered_date || "",
    transferStepRows: (r.deal_transfer_steps || []).sort((a, b) => a.step_index - b.step_index),
    activity: (r.deal_activity || [])
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((a) => ({ id: a.id, text: a.text, timestamp: new Date(a.created_at) })),
    buyerEmail: r.buyer_email || "", buyerName: r.buyer_name || "", sellerEmail: r.seller_email || "",
    sellerName: r.seller_name || "", otpFilePath: r.otp_file_path || "", commStatementFilePath: r.comm_statement_file_path || "",
    otpSentBuyer: r.otp_sent_buyer, otpSentSeller: r.otp_sent_seller, otpSentAttorney: r.otp_sent_attorney,
    otpTodoId: r.otp_todo_id, buyerContactId: r.buyer_contact_id || "", sellerContactId: r.seller_contact_id || "",
    date: new Date(r.created_at),
    deposit: Number(r.deposit) || 0, occupationDate: r.occupation_date || "", occupationalRental: Number(r.occupational_rental) || 0,
    financeRequired: !!r.finance_required, cashPortion: Number(r.cash_portion) || 0,
    buyerPhone: r.buyer_phone || "", sellerPhone: r.seller_phone || "",
    aboveLineAt: r.above_line_at || null, aboveLineBy: r.above_line_by || "", aboveLineNotes: r.above_line_notes || "",
    conditionsFulfilledAt: r.conditions_fulfilled_at || null,
    conditionRows: (r.deal_conditions || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  };
}

const SELECT = "*, deal_activity(*), deal_transfer_steps(*), deal_conditions(*)";

export async function fetchDeals() {
  const { data, error } = await supabase.from("deals").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToDeal);
}

function dealToRow(deal) {
  return {
    lead_id: deal.leadId || null, offer_id: deal.offerId || null, month: deal.month, property: deal.property,
    suburb: deal.suburb, asking_price: deal.askingPrice || null, opening_offer: deal.openingOffer || null,
    conditions: deal.conditions, bond_applying_for: deal.bondApplyingFor || null, bond_through: deal.bondThrough,
    attorney: deal.att, co_seller: deal.coSeller || null, co_buyers: deal.coBuyers || null, cco: deal.cco,
    agreed_offer: deal.agreedOffer || null, shared_deal: deal.sharedDeal, com_percent: deal.comPercent || null,
    confirmed_commission: deal.confirmedCommission || null, suspensive: deal.suspensive || 0, fall_out: deal.fallOut || 0,
    kre_nett_confirmed: deal.kreNettConfirmed || 0, kre_nett_sus: deal.kreNettSus || 0, nett_to_kre: deal.nettToKRE || 0,
    still_to_register: deal.stillToRegister, exp_reg_date: deal.expRegDate || null, deal_tier: deal.dealStatus,
    agent_id: deal.agent, listing_agent_id: deal.listingAgent, shared_with_agent_id: deal.sharedWithAgent || null,
    shared_split: deal.sharedSplit, condition_status: deal.conditionStatus,
    buyer_email: deal.buyerEmail, buyer_name: deal.buyerName, seller_email: deal.sellerEmail, seller_name: deal.sellerName,
    buyer_contact_id: deal.buyerContactId || null, seller_contact_id: deal.sellerContactId || null,
    deposit: deal.deposit || 0, occupation_date: deal.occupationDate || null, occupational_rental: deal.occupationalRental || 0,
    finance_required: !!deal.financeRequired, cash_portion: deal.cashPortion || 0,
    buyer_phone: deal.buyerPhone, seller_phone: deal.sellerPhone,
  };
}

export async function createDeal(deal) {
  const { data, error } = await supabase.from("deals").insert(dealToRow(deal)).select(SELECT).single();
  if (error) throw error;
  const steps = Array.from({ length: 17 }, (_, i) => ({ deal_id: data.id, step_index: i, done: false }));
  const { error: stepsError } = await supabase.from("deal_transfer_steps").insert(steps);
  if (stepsError) throw stepsError;
  return fetchDealById(data.id);
}

export async function fetchDealById(id) {
  const { data, error } = await supabase.from("deals").select(SELECT).eq("id", id).single();
  if (error) throw error;
  return rowToDeal(data);
}

export async function bulkInsertDeals(deals) {
  const rows = deals.map(dealToRow);
  const { data, error } = await supabase.from("deals").insert(rows).select("id");
  if (error) throw error;
  const stepRows = data.flatMap((d) => Array.from({ length: 17 }, (_, i) => ({ deal_id: d.id, step_index: i, done: false })));
  const { error: stepsError } = await supabase.from("deal_transfer_steps").insert(stepRows);
  if (stepsError) throw stepsError;
}

export async function updateDeal(id, patch) {
  const { data, error } = await supabase.from("deals").update(patch).eq("id", id).select(SELECT).single();
  if (error) throw error;
  return rowToDeal(data);
}

export async function addActivity(dealId, text) {
  const { error } = await supabase.from("deal_activity").insert({ deal_id: dealId, text });
  if (error) throw error;
  return fetchDealById(dealId);
}

export async function setTransferStep(dealId, stepIndex, { done, dateCompleted }) {
  const { error } = await supabase
    .from("deal_transfer_steps")
    .update({ done, date_completed: dateCompleted || null })
    .eq("deal_id", dealId)
    .eq("step_index", stepIndex);
  if (error) throw error;
  return fetchDealById(dealId);
}

export async function uploadDealFile(dealId, kind, file) {
  // kind: 'otp' | 'comm-statement'
  const path = `deals/${dealId}/${kind}.pdf`;
  const { error: uploadError } = await supabase.storage.from("deal-documents").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const column = kind === "otp" ? "otp_file_path" : "comm_statement_file_path";
  return updateDeal(dealId, { [column]: path });
}

export async function getDealFileSignedUrl(path) {
  const { data, error } = await supabase.storage.from("deal-documents").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// Suspensive conditions checklist — supplements (doesn't replace) the
// deal's single condition_status field.
export async function addDealCondition(dealId, condition) {
  const { error } = await supabase.from("deal_conditions").insert({
    deal_id: dealId, condition_type: condition.conditionType || "Other", description: condition.description || null,
    responsible_party: condition.responsibleParty || null, due_date: condition.dueDate || null,
    status: condition.status || "Outstanding", mandatory: condition.mandatory !== false,
    created_by: condition.createdBy || null,
  });
  if (error) throw error;
  return fetchDealById(dealId);
}

export async function updateDealCondition(dealId, conditionId, patch) {
  const row = {};
  if (patch.conditionType !== undefined) row.condition_type = patch.conditionType;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.responsibleParty !== undefined) row.responsible_party = patch.responsibleParty;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate || null;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.mandatory !== undefined) row.mandatory = patch.mandatory;
  if (patch.dateFulfilled !== undefined) row.date_fulfilled = patch.dateFulfilled || null;
  if (patch.notes !== undefined) row.notes = patch.notes;
  const { error } = await supabase.from("deal_conditions").update(row).eq("id", conditionId);
  if (error) throw error;
  return fetchDealById(dealId);
}

export async function deleteDealCondition(dealId, conditionId) {
  const { error } = await supabase.from("deal_conditions").delete().eq("id", conditionId);
  if (error) throw error;
  return fetchDealById(dealId);
}
