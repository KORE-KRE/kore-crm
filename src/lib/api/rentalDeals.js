import { supabase } from "../supabaseClient.js";

function rowToRentalDeal(r) {
  return {
    id: r.id, rentalOfferId: r.rental_offer_id || "", month: r.month || "", property: r.property || "", suburb: r.suburb || "",
    landlordName: r.landlord_name || "", landlordPhone: r.landlord_phone || "", landlordContactId: r.landlord_contact_id || "",
    tenantName: r.tenant_name || "", tenantPhone: r.tenant_phone || "", tenantContactId: r.tenant_contact_id || "",
    monthlyRental: Number(r.monthly_rental) || 0, findersFee: Number(r.finders_fee) || 0,
    termOfLeaseMonths: r.term_of_lease_months || "", managed: r.managed !== false,
    adminFeePaid: !!r.admin_fee_paid, monthlyManagementFee: Number(r.monthly_management_fee) || 0,
    monthlyInspections: !!r.monthly_inspections, signedLease: !!r.signed_lease, moveInDate: r.move_in_date || "",
    agent: r.agent_id, listingAgent: r.listing_agent_id, sharedWithAgent: r.shared_with_agent_id || "",
    sharedSplit: r.shared_split || "", status: r.status || "Active",
    date: new Date(r.created_at),
    activity: (r.rental_deal_activity || [])
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((a) => ({ id: a.id, text: a.text, timestamp: new Date(a.created_at) })),
  };
}

const SELECT = "*, rental_deal_activity(*)";

export async function fetchRentalDeals() {
  const { data, error } = await supabase.from("rental_deals").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToRentalDeal);
}

function dealToRow(deal) {
  return {
    rental_offer_id: deal.rentalOfferId || null, month: deal.month, property: deal.property, suburb: deal.suburb,
    landlord_name: deal.landlordName, landlord_phone: deal.landlordPhone, landlord_contact_id: deal.landlordContactId || null,
    tenant_name: deal.tenantName, tenant_phone: deal.tenantPhone, tenant_contact_id: deal.tenantContactId || null,
    monthly_rental: deal.monthlyRental || 0, finders_fee: deal.findersFee || 0,
    term_of_lease_months: deal.termOfLeaseMonths || null, managed: deal.managed !== false,
    admin_fee_paid: !!deal.adminFeePaid, monthly_management_fee: deal.monthlyManagementFee || 0,
    monthly_inspections: !!deal.monthlyInspections, signed_lease: !!deal.signedLease, move_in_date: deal.moveInDate || null,
    agent_id: deal.agent, listing_agent_id: deal.listingAgent, shared_with_agent_id: deal.sharedWithAgent || null,
    shared_split: deal.sharedSplit, status: deal.status || "Active",
  };
}

export async function createRentalDeal(deal) {
  const { data, error } = await supabase.from("rental_deals").insert(dealToRow(deal)).select(SELECT).single();
  if (error) throw error;
  return rowToRentalDeal(data);
}

export async function updateRentalDeal(id, patch) {
  const { data, error } = await supabase.from("rental_deals").update(patch).eq("id", id).select(SELECT).single();
  if (error) throw error;
  return rowToRentalDeal(data);
}

export async function fetchRentalDealById(id) {
  const { data, error } = await supabase.from("rental_deals").select(SELECT).eq("id", id).single();
  if (error) throw error;
  return rowToRentalDeal(data);
}

export async function deleteRentalDeal(id) {
  const { error } = await supabase.from("rental_deals").delete().eq("id", id);
  if (error) throw error;
}

export async function addActivity(dealId, text) {
  const { error } = await supabase.from("rental_deal_activity").insert({ rental_deal_id: dealId, text });
  if (error) throw error;
  return fetchRentalDealById(dealId);
}
