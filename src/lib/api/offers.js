import { supabase } from "../supabaseClient.js";

function rowToOffer(r) {
  return {
    id: r.id, leadId: r.lead_id, dealId: r.deal_id, month: r.month || "", property: r.property || "", suburb: r.suburb || "",
    askingPrice: Number(r.asking_price) || 0, offerMade: Number(r.offer_made) || 0, conditions: r.conditions || "",
    sellerCounterOffer: Number(r.seller_counter_offer) || 0, buyerCounterOffer: Number(r.buyer_counter_offer) || 0,
    agreed: r.agreed || "Pending", agreedPrice: Number(r.agreed_price) || 0, agent: r.agent_id,
    listingAgent: r.listing_agent_id, buyerName: r.buyer_name || "", sellerName: r.seller_name || "",
    buyerContactId: r.buyer_contact_id || "", sellerContactId: r.seller_contact_id || "",
    sharedDeal: r.shared_deal || "", sharedWithAgent: r.shared_with_agent_id || "", sharedSplit: r.shared_split || "",
    comPercent: Number(r.com_percent) || 5, date: new Date(r.created_at),
    activity: (r.offer_activity || [])
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((a) => ({ id: a.id, type: a.type, text: a.text, author: a.author_id, timestamp: new Date(a.created_at) })),
    deposit: Number(r.deposit) || 0, occupationDate: r.occupation_date || "", occupationalRental: Number(r.occupational_rental) || 0,
    financeRequired: !!r.finance_required, cashPortion: Number(r.cash_portion) || 0,
    bondOriginator: r.bond_originator || "", conveyancer: r.conveyancer || "",
    buyerPhone: r.buyer_phone || "", sellerPhone: r.seller_phone || "",
    negotiations: (r.offer_negotiations || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  };
}

const SELECT = "*, offer_activity(*), offer_negotiations(*)";

export async function fetchOffers() {
  const { data, error } = await supabase.from("offers").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToOffer);
}

export async function createOffer(offer) {
  const { data, error } = await supabase
    .from("offers")
    .insert({
      lead_id: offer.leadId || null, month: offer.month || null, property: offer.property, suburb: offer.suburb,
      asking_price: offer.askingPrice || null, offer_made: offer.offerMade || null, conditions: offer.conditions,
      seller_counter_offer: offer.sellerCounterOffer || 0, buyer_counter_offer: offer.buyerCounterOffer || 0,
      agreed: offer.agreed || "Pending", agreed_price: offer.agreedPrice || 0, agent_id: offer.agent,
      listing_agent_id: offer.listingAgent, buyer_name: offer.buyerName, seller_name: offer.sellerName,
      buyer_contact_id: offer.buyerContactId || null, seller_contact_id: offer.sellerContactId || null,
      shared_deal: offer.sharedDeal, shared_with_agent_id: offer.sharedWithAgent || null,
      shared_split: offer.sharedSplit, com_percent: offer.comPercent || 5,
      deposit: offer.deposit || 0, occupation_date: offer.occupationDate || null, occupational_rental: offer.occupationalRental || 0,
      finance_required: !!offer.financeRequired, cash_portion: offer.cashPortion || 0,
      bond_originator: offer.bondOriginator || null, conveyancer: offer.conveyancer || null,
      buyer_phone: offer.buyerPhone || null, seller_phone: offer.sellerPhone || null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return rowToOffer(data);
}

export async function bulkInsertOffers(offers) {
  const rows = offers.map((offer) => ({
    lead_id: null, month: offer.month || null, property: offer.property, suburb: offer.suburb,
    asking_price: offer.askingPrice || null, offer_made: offer.offerMade || null, conditions: offer.conditions,
    seller_counter_offer: offer.sellerCounterOffer || 0, buyer_counter_offer: offer.buyerCounterOffer || 0,
    agreed: offer.agreed || "Pending", agreed_price: offer.agreedPrice || 0, agent_id: offer.agent,
    listing_agent_id: offer.listingAgent || offer.agent, buyer_name: offer.buyerName, seller_name: offer.sellerName,
    shared_deal: offer.sharedDeal, shared_with_agent_id: offer.sharedWithAgent || null,
    shared_split: offer.sharedSplit, com_percent: offer.comPercent || 5,
  }));
  const { error } = await supabase.from("offers").insert(rows);
  if (error) throw error;
}

export async function updateOffer(id, patch) {
  const { data, error } = await supabase.from("offers").update(patch).eq("id", id).select(SELECT).single();
  if (error) throw error;
  return rowToOffer(data);
}

export async function deleteOffer(id) {
  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchOfferById(id) {
  const { data, error } = await supabase.from("offers").select(SELECT).eq("id", id).single();
  if (error) throw error;
  return rowToOffer(data);
}

export async function addActivity(offerId, { type, text, authorId }) {
  const { error } = await supabase.from("offer_activity").insert({ offer_id: offerId, type, text, author_id: authorId });
  if (error) throw error;
  return fetchOfferById(offerId);
}

// Structured negotiation history — each counter gets its own row rather
// than overwriting the offer's current counter-offer numbers.
export async function addNegotiation(offerId, entry) {
  const { error } = await supabase.from("offer_negotiations").insert({
    offer_id: offerId, party: entry.party || "Buyer", action: entry.action || "Counter",
    amount: entry.amount || null, deposit: entry.deposit || null, occupation_date: entry.occupationDate || null,
    occupational_rental: entry.occupationalRental || null, finance_required: entry.financeRequired ?? null,
    cash_portion: entry.cashPortion || null, notes: entry.notes || null, created_by: entry.createdBy || null,
  });
  if (error) throw error;
  return fetchOfferById(offerId);
}
