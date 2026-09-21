import { supabase } from "../supabaseClient.js";

function rowToListing(r) {
  return {
    id: r.id, ref: r.ref, address: r.address, suburb: r.suburb, price: Number(r.price) || 0,
    type: r.type, beds: r.beds, baths: r.baths, parking: r.parking, status: r.status,
    agent: r.agent_id, portals: r.portals || [],
  };
}

export async function fetchListings() {
  const { data, error } = await supabase.from("listings").select("*").order("ref");
  if (error) throw error;
  return data.map(rowToListing);
}

export async function upsertListings(listings) {
  const rows = listings.map((l) => ({
    id: l.id, ref: l.ref, address: l.address, suburb: l.suburb, price: l.price, type: l.type,
    beds: l.beds, baths: l.baths, parking: l.parking, status: l.status, agent_id: l.agent, portals: l.portals,
  }));
  const { error } = await supabase.from("listings").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function addListing(listing) {
  const { data, error } = await supabase
    .from("listings")
    .insert({
      id: listing.id, ref: listing.ref, address: listing.address, suburb: listing.suburb, price: listing.price,
      type: listing.type, beds: listing.beds, baths: listing.baths, parking: listing.parking,
      status: listing.status, agent_id: listing.agent, portals: listing.portals,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToListing(data);
}
