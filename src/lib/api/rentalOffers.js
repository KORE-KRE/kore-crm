import { supabase } from "../supabaseClient.js";

function rowToRentalOffer(r) {
  return {
    id: r.id, month: r.month || "", property: r.property || "", suburb: r.suburb || "",
    landlordName: r.landlord_name || "", landlordPhone: r.landlord_phone || "", landlordContactId: r.landlord_contact_id || "",
    tenantName: r.tenant_name || "", tenantPhone: r.tenant_phone || "", tenantContactId: r.tenant_contact_id || "",
    monthlyRental: Number(r.monthly_rental) || 0, findersFee: Number(r.finders_fee) || 0,
    termOfLeaseMonths: r.term_of_lease_months || "", managed: r.managed !== false, conditions: r.conditions || "",
    agent: r.agent_id, listingAgent: r.listing_agent_id, sharedWithAgent: r.shared_with_agent_id || "",
    sharedSplit: r.shared_split || "", status: r.status || "Pending", dealId: r.deal_id || "",
    date: new Date(r.created_at),
    activity: (r.rental_offer_activity || [])
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((a) => ({ id: a.id, type: a.type, text: a.text, timestamp: new Date(a.created_at) })),
  };
}

const SELECT = "*, rental_offer_activity(*)";

export async function fetchRentalOffers() {
  const { data, error } = await supabase.from("rental_offers").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToRentalOffer);
}

export async function createRentalOffer(offer) {
  const { data, error } = await supabase
    .from("rental_offers")
    .insert({
      month: offer.month || null, property: offer.property, suburb: offer.suburb,
      landlord_name: offer.landlordName, landlord_phone: offer.landlordPhone, landlord_contact_id: offer.landlordContactId || null,
      tenant_name: offer.tenantName, tenant_phone: offer.tenantPhone, tenant_contact_id: offer.tenantContactId || null,
      monthly_rental: offer.monthlyRental || 0, finders_fee: offer.findersFee || 0,
      term_of_lease_months: offer.termOfLeaseMonths || null, managed: offer.managed !== false, conditions: offer.conditions,
      agent_id: offer.agent, listing_agent_id: offer.listingAgent,
      shared_with_agent_id: offer.sharedWithAgent || null, shared_split: offer.sharedSplit,
      status: offer.status || "Pending",
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return rowToRentalOffer(data);
}

export async function updateRentalOffer(id, patch) {
  const { data, error } = await supabase.from("rental_offers").update(patch).eq("id", id).select(SELECT).single();
  if (error) throw error;
  return rowToRentalOffer(data);
}

export async function fetchRentalOfferById(id) {
  const { data, error } = await supabase.from("rental_offers").select(SELECT).eq("id", id).single();
  if (error) throw error;
  return rowToRentalOffer(data);
}

export async function deleteRentalOffer(id) {
  const { error } = await supabase.from("rental_offers").delete().eq("id", id);
  if (error) throw error;
}

export async function addActivity(offerId, { type, text }) {
  const { error } = await supabase.from("rental_offer_activity").insert({ rental_offer_id: offerId, type, text });
  if (error) throw error;
  return fetchRentalOfferById(offerId);
}
